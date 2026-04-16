import { useEffect, useRef, useState } from 'react';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { Button } from '#/components/ui/button';
import {
  clearVideoFailure,
  findVideoContent,
  triggerContentGeneration,
} from '#/data/server-functions/learning';
import type { StrapiContent } from '#/lib/services/learning';

// Shapes returned by the loader, mapped to the UI states rendered below.
type LoaderData =
  | { status: 'found'; content: StrapiContent }
  | { status: 'pending' }
  | { status: 'upgrade' }
  | { status: 'error'; error: string };

export const Route = createFileRoute('/learn/$videoId')({
  loader: async ({ params }): Promise<LoaderData> => {
    // Step 1: query. If the summary already exists, return it — fast path for
    // second and subsequent viewers. This path also runs during the polling
    // loop below, so it must stay cheap.
    const existing = await findVideoContent({ data: { videoId: params.videoId } });
    if (existing) return { status: 'found', content: existing };

    // Step 2: trigger generation. The server fires the AI + Strapi pipeline
    // in the background and returns immediately. The client shows a pending
    // state while polling for completion — no awaiting the AI call here.
    const trigger = await triggerContentGeneration({
      data: { videoId: params.videoId },
    });
    if (trigger.status === 'found') {
      return { status: 'found', content: trigger.content };
    }
    if (trigger.status === 'started') return { status: 'pending' };
    if (trigger.status === 'not_authed' || trigger.status === 'not_pro') {
      return { status: 'upgrade' };
    }
    if (trigger.status === 'rate_limited') {
      return { status: 'error', error: trigger.error };
    }
    return { status: 'error', error: trigger.error };
  },
  component: LearnPage,
  head: ({ loaderData }) => {
    if (loaderData?.status === 'found') {
      const entry = loaderData.content;
      return {
        meta: [
          { title: `${entry.title} · Health` },
          ...(entry.description ? [{ name: 'description', content: entry.description }] : []),
        ],
      };
    }
    return { meta: [{ title: 'Key learning · Health' }] };
  },
});

// Auto-poll while generation is in flight. Every 3s we invalidate the route
// so the loader runs again; the query in step 1 will start returning content
// once the detached server-side job finishes. Stops on unmount or when the
// status flips to `found`. 2-minute ceiling covers the worst case (long
// transcript + slow model) before we surface an error.
function usePollingInvalidation(active: boolean) {
  const router = useRouter();
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!active) {
      attemptsRef.current = 0;
      return;
    }
    const id = window.setInterval(() => {
      attemptsRef.current += 1;
      if (attemptsRef.current > 40) {
        // ~2 minutes at 3s cadence — give up and let the error state render
        // on the next natural refresh.
        window.clearInterval(id);
        return;
      }
      void router.invalidate();
    }, 3000);
    return () => window.clearInterval(id);
  }, [active, router]);
}

function LearnPage() {
  const data = Route.useLoaderData();
  const { videoId } = Route.useParams();

  usePollingInvalidation(data.status === 'pending');

  if (data.status === 'pending') return <PendingState />;
  if (data.status === 'upgrade') return <UpgradeState videoId={videoId} />;
  if (data.status === 'error') return <ErrorState error={data.error} />;
  return <SummaryView entry={data.content} videoId={videoId} />;
}

function SummaryView({
  entry,
  videoId,
}: Readonly<{ entry: StrapiContent; videoId: string }>) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFloating, setIsFloating] = useState(false);

  const seekTo = (seconds: number) => {
    const iframe = iframeRef.current;
    const win = iframe?.contentWindow;
    if (!win || !iframe) return;
    const origin = 'https://www.youtube.com';
    win.postMessage(
      JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }),
      origin,
    );
    win.postMessage(
      JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
      origin,
    );
    // When the video is floating (fixed position) it's always on-screen, no
    // scroll needed. When sticky, check visibility and scroll only if it's
    // off-screen (handles mobile + scrolled-past cases).
    if (isFloating) return;
    const rect = iframe.getBoundingClientRect();
    const viewportH = window.innerHeight || document.documentElement.clientHeight;
    const fullyVisible = rect.top >= 0 && rect.bottom <= viewportH;
    if (!fullyVisible) {
      iframe.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <main className="page-wrap px-4 pb-20 pt-10 sm:pt-16">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--card)] px-3 py-1 text-xs font-medium text-[var(--ink-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            Key learning
          </span>
          <h1 className="display-title mt-5 text-3xl leading-[1.1] text-[var(--ink)] sm:text-5xl">
            {entry.title}
          </h1>
          {entry.description && (
            <p className="mt-4 text-base leading-relaxed text-[var(--ink-soft)] sm:text-lg">
              {entry.description}
            </p>
          )}
        </header>

        {/* Video: sticky at top of the content column by default, or
            floating mini-player in the bottom-right when the user toggles.
            Same iframe node in both modes, so playback never interrupts. A
            placeholder fills the original slot when floating so the page
            doesn't jump. */}
        <div
          className={
            isFloating
              ? 'fixed bottom-4 right-4 z-40 w-72 shadow-2xl sm:bottom-6 sm:right-6 sm:w-80'
              : // `top-16` clears the ~64px sticky site header so the video
                // docks below it instead of being cut off. `pt-4 pb-6` is
                // part of the sticky box's background, so content scrolling
                // up behind the video gets visible breathing room — the card
                // feels like it has a deliberate gutter below it.
                'sticky top-16 z-10 bg-[var(--bg)] pt-4 pb-6'
          }
        >
          <div className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-black">
            <div className="relative aspect-video w-full">
              <iframe
                ref={iframeRef}
                src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0`}
                title={entry.videoTitle ?? entry.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsFloating((f) => !f)}
              aria-label={isFloating ? 'Pin video to top' : 'Float video to the corner'}
              className="absolute right-2 top-2 inline-flex h-7 items-center gap-1.5 rounded-full bg-black/70 px-2.5 text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--cream)] backdrop-blur transition hover:bg-black"
            >
              {isFloating ? (
                <>
                  <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true">
                    <path fill="currentColor" d="M8 1l2.5 4h-2v5h-1V5h-2L8 1zM3 13h10v1H3v-1z" />
                  </svg>
                  Pin
                </>
              ) : (
                <>
                  <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M9 1v6h6v1a7 7 0 1 1-7-7h1zm1 0a6 6 0 0 1 5 5h-5V1z"
                    />
                  </svg>
                  Float
                </>
              )}
            </button>
          </div>
        </div>

        {/* Reserve the video's original height while it's floating so the
            content below doesn't suddenly jump up. */}
        {isFloating && <div aria-hidden="true" className="mb-6 aspect-video w-full" />}

        {(entry.videoTitle ?? entry.videoAuthor) && (
          <p className="mb-10 text-xs leading-relaxed text-[var(--ink-muted)]">
            Based on{' '}
            {entry.videoTitle && (
              <span className="font-medium text-[var(--ink)]">{entry.videoTitle}</span>
            )}
            {entry.videoAuthor && (
              <>
                {entry.videoTitle ? ' by ' : ''}
                <span className="font-medium text-[var(--ink)]">{entry.videoAuthor}</span>
              </>
            )}
          </p>
        )}

        {entry.content && (
          <section className="mb-12">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
              Overview
            </h2>
            <div className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-[var(--ink-soft)]">
              {entry.content}
            </div>
          </section>
        )}

        {entry.keyTakeaways && entry.keyTakeaways.length > 0 && (
          <section className="mb-12">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
              Key takeaways
            </h2>
            <ul className="mt-4 grid gap-2.5">
              {entry.keyTakeaways.map((t) => (
                <li
                  key={t.id}
                  className="flex items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-3 text-sm leading-relaxed text-[var(--ink-soft)]"
                >
                  <span className="mt-[0.4rem] h-1.5 w-1.5 flex-none rounded-full bg-[var(--accent)]" />
                  <span>{t.text}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {entry.sections && entry.sections.length > 0 && (
          <section className="mb-12">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
              Walkthrough
            </h2>
            <div className="mt-4 grid gap-3">
              {entry.sections.map((s) => {
                const hasTime = typeof s.timeSec === 'number';
                return (
                  <article
                    key={s.id}
                    className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 sm:p-6"
                  >
                    <header className="flex items-start justify-between gap-3">
                      <h3 className="flex-1 text-base font-semibold leading-snug text-[var(--ink)]">
                        {s.heading}
                      </h3>
                      {hasTime && (
                        <button
                          type="button"
                          onClick={() => seekTo(s.timeSec as number)}
                          className="inline-flex h-7 flex-none items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--bg-subtle)] px-3 text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--ink)] hover:text-[var(--cream)]"
                          aria-label={`Jump to ${formatTime(s.timeSec as number)} in the video`}
                        >
                          <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true">
                            <path fill="currentColor" d="M4 2v12l9-6z" />
                          </svg>
                          {formatTime(s.timeSec as number)}
                        </button>
                      )}
                    </header>
                    <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink-soft)]">
                      {s.body}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {entry.actionSteps && entry.actionSteps.length > 0 && (
          <section className="mb-12">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
              Your plan
            </h2>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              Concrete things to try this week, based on the video.
            </p>
            <ol className="mt-5 grid gap-3">
              {entry.actionSteps.map((step, i) => (
                <li
                  key={step.id}
                  className="flex gap-4 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 sm:p-6"
                >
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[var(--ink)] text-sm font-bold text-[var(--cream)]">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold leading-snug text-[var(--ink)]">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink-soft)]">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <footer className="mt-16 border-t border-[var(--line)] pt-5 text-xs text-[var(--ink-muted)]">
          <p>
            Generated by {entry.author?.displayName ?? 'a member'}
            {entry.aiModel ? ` using ${entry.aiModel}` : ''}. Summaries are auto-generated and may
            contain errors — treat them as notes, not medical advice.
          </p>
        </footer>
      </div>
    </main>
  );
}

function PendingState() {
  return (
    <main className="page-wrap flex min-h-[60vh] items-center justify-center px-4 py-14">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--card)] p-10 text-center">
        <div
          aria-hidden="true"
          className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-[var(--line)] border-t-[var(--ink)]"
        />
        <h1 className="display-title mt-6 text-2xl text-[var(--ink)]">
          Generating your summary…
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">
          Fetching the transcript and running it through Claude. This usually takes 5–15
          seconds. You can leave this page — the job keeps running, and the summary will be
          waiting next time you come back.
        </p>
        <ul
          className="mt-5 grid gap-1.5 text-left text-xs text-[var(--ink-muted)]"
          aria-live="polite"
        >
          <li>• Pulling the transcript</li>
          <li>• Fetching video metadata</li>
          <li>• Extracting key takeaways, walkthrough, and your plan</li>
        </ul>
      </div>
    </main>
  );
}

function UpgradeState({ videoId }: Readonly<{ videoId: string }>) {
  return (
    <main className="page-wrap flex min-h-[60vh] items-center justify-center px-4 py-14">
      <div className="mx-auto max-w-md rounded-2xl border border-[var(--line)] bg-[var(--card)] p-10 text-center">
        <span className="inline-flex items-center rounded-full bg-[var(--band-yellow-bg)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--band-yellow-text)]">
          Pro
        </span>
        <h1 className="display-title mt-4 text-3xl text-[var(--ink)]">Not generated yet.</h1>
        <p className="mt-3 text-sm text-[var(--ink-soft)]">
          No one's generated a summary for this video yet. Pro members can unlock it — the summary
          is then free for the whole community forever.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild size="pill">
            <Link to="/upgrade">Upgrade to Pro</Link>
          </Button>
          <Button asChild size="pill" variant="outline">
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noreferrer"
            >
              Watch on YouTube
            </a>
          </Button>
        </div>
      </div>
    </main>
  );
}

function ErrorState({ error }: Readonly<{ error: string }>) {
  const router = useRouter();
  const { videoId } = Route.useParams();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    // Clear the server-side failure cache so the next loader invocation
    // actually re-triggers generation (rather than returning the cached
    // error). Then invalidate to re-run the loader.
    await clearVideoFailure({ data: { videoId } });
    await router.invalidate();
    setRetrying(false);
  };

  return (
    <main className="page-wrap flex min-h-[60vh] items-center justify-center px-4 py-14">
      <div className="mx-auto max-w-md rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <h1 className="display-title text-2xl text-[var(--ink)]">Couldn't generate the summary</h1>
        <p className="mt-3 text-sm text-[var(--ink-soft)]">{error}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button type="button" size="pill" onClick={handleRetry} disabled={retrying}>
            {retrying ? 'Retrying…' : 'Retry'}
          </Button>
        </div>
      </div>
    </main>
  );
}

function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}
