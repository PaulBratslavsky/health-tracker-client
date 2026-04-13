import { useEffect, useRef, useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { Button } from '#/components/ui/button';
import { Label } from '#/components/ui/label';
import { Input } from '#/components/ui/input';
import { Textarea } from '#/components/ui/textarea';
import { createPost } from '#/data/server-functions/posts';
import { fetchUrlMetadata } from '#/data/server-functions/metadata';
import type { UrlMetadata } from '#/lib/services/url-metadata';
import { FormFooter } from './CheckinSubForm';

const DEBOUNCE_MS = 500;

export type ShareKind = 'link' | 'image_embed' | 'youtube';

type Props = {
  kind: ShareKind;
};

const COPY: Record<
  ShareKind,
  { placeholder: string; helper: string; submit: string }
> = {
  link: {
    placeholder: 'https://example.com/article',
    helper: 'Paste a link to an article, study, recipe, or thread.',
    submit: 'Share link',
  },
  image_embed: {
    placeholder: 'https://example.com/photo.jpg',
    helper: 'Paste a URL to an image hosted somewhere else.',
    submit: 'Share photo',
  },
  youtube: {
    placeholder: 'https://www.youtube.com/watch?v=...',
    helper: 'Paste a YouTube URL — works with watch, shorts, or youtu.be links.',
    submit: 'Share video',
  },
};

export function ShareSubForm({ kind }: Props) {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [meta, setMeta] = useState<UrlMetadata | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const lastFetchedUrl = useRef<string | null>(null);

  // Debounced metadata fetch when the URL changes
  useEffect(() => {
    setFetchError(null);
    if (!url || url.length < 8 || !/^https?:\/\//i.test(url)) {
      setMeta(null);
      return;
    }
    if (url === lastFetchedUrl.current) return;

    const handle = setTimeout(async () => {
      setFetching(true);
      lastFetchedUrl.current = url;
      const result = await fetchUrlMetadata({ data: { url } });
      setFetching(false);
      if (!result.success) {
        setMeta(null);
        setFetchError(result.error);
        return;
      }
      setMeta(result.data);
    }, DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setServerError(null);

    if (!url) {
      setServerError('Paste a URL first');
      return;
    }
    if (!meta) {
      setServerError('Wait for the preview to load');
      return;
    }

    // Enforce that what the user submitted matches the tab they're on
    if (kind === 'youtube' && meta.kind !== 'youtube') {
      setServerError("That doesn't look like a YouTube URL");
      return;
    }
    if (kind === 'image_embed' && meta.kind !== 'image') {
      setServerError("That URL isn't an image");
      return;
    }

    setSubmitting(true);

    const trimmedCaption = caption.trim() || undefined;
    let result;

    if (meta.kind === 'youtube' && meta.videoId) {
      result = await createPost({
        data: {
          type: 'youtube',
          caption: trimmedCaption,
          url: meta.url,
          youtubeVideoId: meta.videoId,
          linkTitle: meta.title,
          linkImageUrl: meta.imageUrl,
        },
      });
    } else if (meta.kind === 'image') {
      result = await createPost({
        data: {
          type: 'image_embed',
          caption: trimmedCaption,
          url: meta.url,
        },
      });
    } else {
      result = await createPost({
        data: {
          type: 'link',
          caption: trimmedCaption,
          url: meta.url,
          linkTitle: meta.title,
          linkDescription: meta.description,
          linkImageUrl: meta.imageUrl,
          linkSiteName: meta.siteName,
        },
      });
    }

    setSubmitting(false);

    if (result.success) {
      await router.invalidate();
      router.navigate({ to: '/' });
    } else {
      setServerError(result.error);
    }
  };

  const copy = COPY[kind];

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div>
        <Label htmlFor="share-url" className="mb-1.5 block text-sm font-medium">
          URL
        </Label>
        <Input
          id="share-url"
          type="url"
          placeholder={copy.placeholder}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={submitting}
          autoComplete="off"
          spellCheck={false}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">{copy.helper}</p>
      </div>

      <PreviewBlock kind={kind} meta={meta} fetching={fetching} fetchError={fetchError} />

      <div>
        <Label htmlFor="share-caption" className="mb-1.5 block text-sm font-medium">
          Caption (optional)
        </Label>
        <Textarea
          id="share-caption"
          placeholder="Why this is worth sharing"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          disabled={submitting}
          rows={2}
          className="resize-none"
        />
      </div>

      {serverError && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <FormFooter
        isSubmitting={submitting}
        canSubmit={Boolean(meta) && !fetching}
        submitLabel={copy.submit}
      />
    </form>
  );
}

function PreviewBlock({
  kind,
  meta,
  fetching,
  fetchError,
}: {
  kind: ShareKind;
  meta: UrlMetadata | null;
  fetching: boolean;
  fetchError: string | null;
}) {
  if (fetching) {
    return (
      <div className="rounded-xl border border-input bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
        Fetching preview…
      </div>
    );
  }
  if (fetchError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {fetchError}
      </div>
    );
  }
  if (!meta) {
    return (
      <div className="rounded-xl border border-dashed border-input bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
        Preview will appear here once you paste a URL
      </div>
    );
  }

  // Mismatch warning if the resolved kind doesn't match the active tab
  const resolved =
    meta.kind === 'youtube' ? 'youtube' : meta.kind === 'image' ? 'image_embed' : 'link';
  if (resolved !== kind) {
    return (
      <div className="rounded-xl border border-amber-300/40 bg-amber-50/40 px-4 py-3 text-sm text-amber-900">
        That URL looks like a <strong>{resolved.replace('_', ' ')}</strong>, not a{' '}
        <strong>{kind.replace('_', ' ')}</strong>. Switch tabs above.
      </div>
    );
  }

  if (kind === 'youtube' && meta.videoId) {
    return (
      <div className="overflow-hidden rounded-xl border border-input">
        <div className="aspect-video w-full bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${meta.videoId}`}
            title={meta.title ?? 'YouTube preview'}
            loading="lazy"
            allowFullScreen
            className="h-full w-full border-0"
          />
        </div>
        {meta.title && (
          <p className="border-t border-[var(--line)] px-4 py-3 text-sm font-semibold">
            {meta.title}
          </p>
        )}
      </div>
    );
  }

  if (kind === 'image_embed') {
    return (
      <div className="overflow-hidden rounded-xl border border-input bg-[var(--sand)]">
        <img
          src={meta.url}
          alt="Preview"
          referrerPolicy="no-referrer"
          className="aspect-square w-full object-cover"
        />
      </div>
    );
  }

  // Link preview
  return (
    <div className="overflow-hidden rounded-xl border border-input bg-[var(--surface-strong)]">
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
        {meta.imageUrl && (
          <img
            src={meta.imageUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-20 w-20 flex-shrink-0 rounded-lg object-cover ring-1 ring-[var(--line)]"
          />
        )}
        <div className="min-w-0 flex-1">
          {meta.siteName && (
            <p className="island-kicker mb-1 text-[0.6rem]">{meta.siteName}</p>
          )}
          <h3 className="line-clamp-2 text-sm font-semibold text-[var(--sea-ink)]">
            {meta.title ?? meta.url}
          </h3>
          {meta.description && (
            <p className="mt-1 line-clamp-2 text-xs text-[var(--sea-ink-soft)]">
              {meta.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
