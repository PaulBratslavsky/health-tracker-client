import { useState } from 'react';
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import { Button } from '#/components/ui/button';
import { FastTimer } from '#/components/FastTimer';
import { getCurrentUser } from '#/data/server-functions/auth';
import {
  deleteFast,
  endFast,
  getActiveFast,
  getMyFasts,
  startFast,
} from '#/data/server-functions/fasts';
import type { StrapiFast } from '#/lib/services/fasts';

export const Route = createFileRoute('/fast')({
  beforeLoad: async () => {
    const me = await getCurrentUser();
    if (!me) throw redirect({ to: '/sign-in' });
  },
  loader: async () => {
    const [active, history] = await Promise.all([getActiveFast(), getMyFasts()]);
    return { active, history };
  },
  component: FastPage,
  head: () => ({ meta: [{ title: 'Fast · Health' }] }),
});

type TargetChoice = 16 | 24 | 36 | null;

function FastPage() {
  const { active, history } = Route.useLoaderData();
  const router = useRouter();
  const [target, setTarget] = useState<TargetChoice>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setSubmitting(true);
    setError(null);
    const result = await startFast({
      data: { targetHours: target ?? undefined },
    });
    setSubmitting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await router.invalidate();
  };

  const handleEnd = async (cancelled: boolean) => {
    if (!active) return;
    setSubmitting(true);
    setError(null);
    const result = await endFast({
      data: { documentId: active.documentId, cancelled },
    });
    setSubmitting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await router.invalidate();
  };

  const handleDelete = async (documentId: string) => {
    setSubmitting(true);
    setError(null);
    const result = await deleteFast({ data: { documentId } });
    setSubmitting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await router.invalidate();
  };

  return (
    <main className="page-wrap px-4 pb-12 pt-10 sm:pt-14">
      <header className="mb-10">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-(--line) bg-card px-3 py-1 text-xs font-medium text-(--ink-muted)">
          <span className="h-1.5 w-1.5 rounded-full bg-(--accent)" />
          Fasting
        </span>
        <h1 className="display-title mt-5 text-4xl text-(--ink) sm:text-5xl">
          {active ? 'Fast in progress' : 'Start a fast'}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-(--ink-soft)">
          Track your fasting window. Private by default — fasts never appear in the feed. Capped
          at 36 hours for safety.
        </p>
      </header>

      {active ? (
        <ActiveFastView
          fast={active}
          onAutoClamp={() => handleEnd(false)}
          onEnd={() => handleEnd(false)}
          onCancel={() => handleEnd(true)}
          submitting={submitting}
        />
      ) : (
        <StartFastView
          target={target}
          onTargetChange={setTarget}
          onStart={handleStart}
          submitting={submitting}
        />
      )}

      {error && (
        <p className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <FastHistory fasts={history} onDelete={handleDelete} submitting={submitting} />
    </main>
  );
}

function StartFastView({
  target,
  onTargetChange,
  onStart,
  submitting,
}: Readonly<{
  target: TargetChoice;
  onTargetChange: (t: TargetChoice) => void;
  onStart: () => void;
  submitting: boolean;
}>) {
  const targets: Array<{ value: TargetChoice; label: string; hint: string }> = [
    { value: null, label: 'No target', hint: 'Start freely; end when you want' },
    { value: 16, label: '16h', hint: 'Classic 16:8 intermittent window' },
    { value: 24, label: '24h', hint: 'One full day' },
    { value: 36, label: '36h', hint: 'The safety ceiling on this app' },
  ];

  return (
    <section className="rounded-2xl border border-(--line) bg-card p-6 sm:p-8">
      <h2 className="text-base font-semibold text-(--ink)">Pick a target (optional)</h2>
      <p className="mt-1 text-xs text-(--ink-muted)">
        A target fills the progress ring toward your goal. You can always end a fast early.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {targets.map((t) => {
          const selected = target === t.value;
          return (
            <button
              key={String(t.value)}
              type="button"
              onClick={() => onTargetChange(t.value)}
              disabled={submitting}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                selected
                  ? 'border-(--ink) bg-(--ink) text-white'
                  : 'border-(--line) bg-card text-(--ink) hover:bg-(--bg-subtle)'
              }`}
            >
              <div className="text-sm font-semibold">{t.label}</div>
              <div
                className={`mt-0.5 text-xs ${selected ? 'text-white/70' : 'text-(--ink-muted)'}`}
              >
                {t.hint}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          type="button"
          onClick={onStart}
          disabled={submitting}
          className="h-11 rounded-full bg-(--ink) px-6 text-sm font-medium hover:bg-(--ink-soft)"
        >
          {submitting ? 'Starting…' : 'Start fast'}
        </Button>
      </div>
    </section>
  );
}

function ActiveFastView({
  fast,
  onAutoClamp,
  onEnd,
  onCancel,
  submitting,
}: Readonly<{
  fast: StrapiFast;
  onAutoClamp: () => void;
  onEnd: () => void;
  onCancel: () => void;
  submitting: boolean;
}>) {
  return (
    <section className="rounded-2xl border border-(--line) bg-card p-8 sm:p-10">
      <FastTimer
        startedAt={fast.startedAt}
        targetHours={fast.targetHours}
        onAutoClamp={onAutoClamp}
      />
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Button
          type="button"
          onClick={onEnd}
          disabled={submitting}
          className="h-11 rounded-full bg-(--ink) px-6 text-sm font-medium hover:bg-(--ink-soft)"
        >
          {submitting ? 'Ending…' : 'End fast'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={submitting}
          className="h-11 rounded-full px-6 text-sm font-medium text-(--ink-muted) hover:text-(--ink)"
        >
          Cancel (don't record)
        </Button>
      </div>
    </section>
  );
}

function formatDuration(startedAt: string, endedAt: string): string {
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

function formatDateShort(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function FastHistory({
  fasts,
  onDelete,
  submitting,
}: Readonly<{
  fasts: StrapiFast[];
  onDelete: (documentId: string) => void;
  submitting: boolean;
}>) {
  const completed = fasts.filter((f) => f.endedAt != null);
  if (completed.length === 0) {
    return (
      <section className="mt-12">
        <h2 className="display-title text-2xl text-(--ink)">History</h2>
        <p className="mt-3 text-sm text-(--ink-muted)">No completed fasts yet.</p>
      </section>
    );
  }

  return (
    <section className="mt-12">
      <h2 className="display-title text-2xl text-(--ink)">History</h2>
      <ul className="mt-5 divide-y divide-(--line) rounded-2xl border border-(--line) bg-card">
        {completed.map((fast) => {
          const duration = fast.endedAt ? formatDuration(fast.startedAt, fast.endedAt) : '—';
          const elapsedHours = fast.endedAt
            ? (new Date(fast.endedAt).getTime() - new Date(fast.startedAt).getTime()) /
              (60 * 60 * 1000)
            : 0;
          const highest = [36, 24, 16].find((m) => elapsedHours >= m);
          return (
            <li
              key={fast.documentId}
              className="flex items-center justify-between gap-4 px-5 py-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-(--ink)">{duration}</span>
                  {highest && (
                    <span className="inline-flex items-center rounded-full bg-(--bg-subtle) px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-(--ink-muted)">
                      {highest}h reached
                    </span>
                  )}
                  {fast.cancelled && (
                    <span className="inline-flex items-center rounded-full bg-(--bg-subtle) px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-(--ink-muted)">
                      cancelled
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-(--ink-muted)">
                  {formatDateShort(fast.startedAt)}
                  {fast.endedAt ? ` → ${formatDateShort(fast.endedAt)}` : ''}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDelete(fast.documentId)}
                disabled={submitting}
                aria-label="Delete this fast"
                className="rounded-md p-2 text-(--ink-muted) transition hover:bg-(--band-red-bg) hover:text-(--band-red-text)"
              >
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M6.5 1a.5.5 0 0 0-.5.5V2H3a.5.5 0 0 0 0 1h.5l.6 10.05A1.5 1.5 0 0 0 5.6 14.5h4.8a1.5 1.5 0 0 0 1.5-1.45L12.5 3h.5a.5.5 0 0 0 0-1H10v-.5a.5.5 0 0 0-.5-.5h-3zM5.1 3h5.8l-.59 10H5.69L5.1 3z"
                  />
                </svg>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
