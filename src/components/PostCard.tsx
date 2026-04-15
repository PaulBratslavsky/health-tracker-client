import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar';
import { DeletePostDialog } from '#/components/DeletePostDialog';
import { ReportDialog } from '#/components/ReportDialog';
import { ShareDialog } from '#/components/ShareDialog';
import {
  BAND_BG,
  BAND_DOT,
  BAND_FG,
  BAND_HERO_BG,
  BAND_HERO_FG,
  BAND_LABEL,
  bandFor,
  computeWhtr,
} from '#/lib/whtr';
import { isPremium } from '#/lib/premium';
import { strapiAssetUrl, type StrapiPost } from '#/lib/services/posts';

type PostCardContext = {
  canReport?: boolean;
  isOwnPost?: boolean;
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

// Clean product card: white surface, 1px zinc border, subtle hover lift via
// shadow only — no border-weight changes, no hard offsets.
function OuterCard({ children }: { children: React.ReactNode }) {
  return (
    <article className="rise-in overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(9,9,11,0.04),0_12px_32px_rgba(9,9,11,0.06)]">
      {children}
    </article>
  );
}

function CardHeaderRow({
  post,
  context,
}: {
  post: StrapiPost;
  context?: PostCardContext;
}) {
  const author = post.author;
  const avatarUrl = strapiAssetUrl(author?.avatar?.url ?? null);
  const initial = (author?.displayName ?? '?').slice(0, 1).toUpperCase();
  const isInReview = post.status === 'in_review';
  return (
    <header className="flex items-center gap-3 px-5 pt-5">
      <Avatar className="h-10 w-10">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={author?.displayName ?? ''} /> : null}
        <AvatarFallback className="bg-[var(--bg-subtle)] text-sm font-medium text-[var(--ink-soft)]">
          {initial}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-1 flex-col leading-tight">
        <span className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-[var(--ink)]">
          {author?.displayName ?? 'Unknown'}
          {isPremium(author) && (
            <span
              className="inline-flex items-center rounded-full bg-[var(--band-yellow-bg)] px-1.5 py-px text-[0.55rem] font-semibold uppercase tracking-wider text-[var(--band-yellow-text)]"
              title="Health Pro member"
            >
              Pro
            </span>
          )}
        </span>
        <span className="text-xs text-[var(--ink-muted)]">{relativeTime(post.createdAt)}</span>
      </div>
      {context?.isOwnPost && isInReview && (
        <span className="inline-flex items-center rounded-md bg-[var(--band-yellow-bg)] px-2 py-0.5 text-[0.65rem] font-medium text-[var(--band-yellow-text)]">
          In review
        </span>
      )}
    </header>
  );
}

function CardActions({
  post,
  context,
}: {
  post: StrapiPost;
  context?: PostCardContext;
}) {
  return (
    <div className="flex items-center gap-1 border-t border-[var(--line)] px-3 py-2">
      <ShareDialog
        postDocumentId={post.documentId}
        shareText={post.caption ?? post.linkTitle ?? 'Check out this post'}
        trigger={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-[var(--ink-muted)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--ink)]"
            aria-label="Share this post"
          >
            <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
              <path
                fill="currentColor"
                d="M11 1a2.5 2.5 0 0 0-2.5 2.5 2.4 2.4 0 0 0 .1.7L5.1 6.8A2.5 2.5 0 0 0 1 8.5a2.5 2.5 0 0 0 4.1 1.7l3.5 2.6a2.4 2.4 0 0 0-.1.7 2.5 2.5 0 1 0 .75-1.78L5.75 9.13a2.4 2.4 0 0 0 0-1.26l3.5-2.6A2.5 2.5 0 1 0 11 1z"
              />
            </svg>
            Share
          </button>
        }
      />
      {context?.canReport && !context?.isOwnPost && (
        <ReportDialog
          postDocumentId={post.documentId}
          trigger={
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-[var(--ink-muted)] transition hover:bg-[var(--band-red-bg)] hover:text-[var(--band-red-text)]"
              aria-label="Report this post"
            >
              <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M3 1.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .45.71L10.31 5l1.64 3.29A.5.5 0 0 1 11.5 9H4v5.5a.5.5 0 0 1-1 0V1.5z"
                />
              </svg>
              Report
            </button>
          }
        />
      )}
      {context?.isOwnPost && (
        <DeletePostDialog
          postDocumentId={post.documentId}
          trigger={
            <button
              type="button"
              className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-[var(--ink-muted)] transition hover:bg-[var(--band-red-bg)] hover:text-[var(--band-red-text)]"
              aria-label="Delete this post"
            >
              <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M6.5 1a.5.5 0 0 0-.5.5V2H3a.5.5 0 0 0 0 1h.5l.6 10.05A1.5 1.5 0 0 0 5.6 14.5h4.8a1.5 1.5 0 0 0 1.5-1.45L12.5 3h.5a.5.5 0 0 0 0-1H10v-.5a.5.5 0 0 0-.5-.5h-3zM5.1 3h5.8l-.59 10H5.69L5.1 3zm1.9 2.5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2 0a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5z"
                />
              </svg>
              Delete
            </button>
          }
        />
      )}
    </div>
  );
}

function MeasurementCard({ post, context }: { post: StrapiPost; context?: PostCardContext }) {
  if (post.waistCm == null || post.heightSnapshotCm == null) return null;
  const whtr = computeWhtr(post.waistCm, post.heightSnapshotCm);
  const band = bandFor(whtr);
  const imageUrl = strapiAssetUrl(post.image?.url ?? null);
  return (
    <OuterCard>
      <CardHeaderRow post={post} context={context} />

      {/* Pro feature — uploaded image appears above the hero when present. */}
      {imageUrl && (
        <div className="mt-4 overflow-hidden bg-[var(--bg-subtle)]">
          <img
            src={imageUrl}
            alt={post.caption?.slice(0, 60) ?? 'Check-in photo'}
            loading="lazy"
            className="aspect-square w-full object-cover"
          />
        </div>
      )}

      {/* The hero block — big, saturated, confident. This is the one thing
          in the whole UI that's allowed to shout. Everything else is quiet
          neutral chrome, which is what lets this land. */}
      <div
        className={`mx-4 mt-4 flex flex-col items-center justify-center rounded-2xl px-6 py-14 ${BAND_HERO_BG[band]} ${BAND_HERO_FG[band]}`}
      >
        <div className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] opacity-80">
          Waist / Height
        </div>
        <div className="display-title mt-3 text-[6rem] leading-none tabular-nums">
          {whtr.toFixed(2)}
        </div>
        <div className="mt-3 text-[0.8rem] font-semibold uppercase tracking-[0.16em] opacity-90">
          {BAND_LABEL[band]}
        </div>
      </div>

      {post.caption && (
        <p className="px-5 pb-3 pt-4 text-sm leading-relaxed text-[var(--ink-soft)]">
          {post.caption}
        </p>
      )}

      <div className="mx-4 mb-4 flex items-center justify-between gap-3 rounded-lg bg-[var(--bg-subtle)] px-3 py-2 text-xs text-[var(--ink-muted)]">
        <span>
          Waist <span className="font-semibold text-[var(--ink)]">{post.waistCm}cm</span>
        </span>
        <span className="h-3 w-px bg-[var(--line)]" />
        <span>
          Height{' '}
          <span className="font-semibold text-[var(--ink)]">{post.heightSnapshotCm}cm</span>
        </span>
      </div>
      <CardActions post={post} context={context} />
    </OuterCard>
  );
}

function ImageEmbedCard({ post, context }: { post: StrapiPost; context?: PostCardContext }) {
  // Prefer the Strapi-hosted image (Pro upload) over the external URL.
  // Either one is sufficient; the schema requires at least one.
  const hostedUrl = strapiAssetUrl(post.image?.url ?? null);
  const imageSrc = hostedUrl ?? post.url;
  if (!imageSrc) return null;
  // Skip the no-referrer policy for our own Strapi-hosted images so the
  // browser sends the Referer header (lets us serve hot-linked uploads
  // safely later if we ever care).
  const isHosted = hostedUrl != null;
  return (
    <OuterCard>
      <CardHeaderRow post={post} context={context} />
      <div className="mt-4 overflow-hidden bg-[var(--bg-subtle)]">
        <img
          src={imageSrc}
          alt={post.caption?.slice(0, 60) ?? 'Image'}
          loading="lazy"
          referrerPolicy={isHosted ? undefined : 'no-referrer'}
          className="aspect-square w-full object-cover"
        />
      </div>
      {post.caption && (
        <p className="px-5 py-4 text-sm leading-relaxed text-[var(--ink-soft)]">
          {post.caption}
        </p>
      )}
      <CardActions post={post} context={context} />
    </OuterCard>
  );
}

function YoutubeCard({ post, context }: { post: StrapiPost; context?: PostCardContext }) {
  if (!post.youtubeVideoId) return null;
  const src = `https://www.youtube-nocookie.com/embed/${post.youtubeVideoId}`;
  return (
    <OuterCard>
      <CardHeaderRow post={post} context={context} />
      <div className="mt-4 aspect-video w-full overflow-hidden bg-black">
        <iframe
          src={src}
          title={post.linkTitle ?? 'YouTube video'}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full border-0"
        />
      </div>
      <div className="grid gap-1.5 px-5 py-4">
        {post.linkTitle && (
          <h3 className="text-lg font-semibold leading-snug tracking-tight text-[var(--ink)]">
            {post.linkTitle}
          </h3>
        )}
        {post.caption && (
          <p className="text-sm leading-relaxed text-[var(--ink-muted)]">{post.caption}</p>
        )}
      </div>
      <CardActions post={post} context={context} />
    </OuterCard>
  );
}

function LinkCard({ post, context }: { post: StrapiPost; context?: PostCardContext }) {
  if (!post.url) return null;
  let host: string | null = null;
  try {
    host = new URL(post.url).hostname.replace(/^www\./, '');
  } catch {
    host = post.linkSiteName ?? null;
  }
  const displayHost = post.linkSiteName ?? host;

  return (
    <OuterCard>
      <CardHeaderRow post={post} context={context} />

      {post.linkImageUrl && (
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group/link mt-4 block overflow-hidden border-y border-[var(--line)] bg-[var(--bg-subtle)]"
        >
          <div className="relative aspect-video w-full">
            <img
              src={post.linkImageUrl}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition duration-500 group-hover/link:scale-[1.02]"
            />
          </div>
        </a>
      )}

      <div className="grid gap-2 px-5 py-4">
        {displayHost && (
          <span className="text-[0.7rem] font-medium uppercase tracking-wide text-[var(--ink-muted)]">
            {displayHost}
          </span>
        )}
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="no-underline"
        >
          <h3 className="line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-[var(--ink)] transition hover:text-[var(--accent)]">
            {post.linkTitle ?? post.url}
          </h3>
        </a>
        {post.linkDescription && (
          <p className="line-clamp-3 text-sm leading-relaxed text-[var(--ink-muted)]">
            {post.linkDescription}
          </p>
        )}
        {post.caption && (
          <p className="mt-1 border-t border-[var(--line)] pt-3 text-sm leading-relaxed text-[var(--ink-soft)]">
            {post.caption}
          </p>
        )}
      </div>
      <CardActions post={post} context={context} />
    </OuterCard>
  );
}

export function PostCard({
  post,
  currentUserProfileDocumentId,
}: {
  post: StrapiPost;
  currentUserProfileDocumentId?: string | null;
}) {
  const isOwnPost =
    currentUserProfileDocumentId != null &&
    post.author?.documentId === currentUserProfileDocumentId;
  const context: PostCardContext = {
    canReport: currentUserProfileDocumentId != null,
    isOwnPost,
  };
  switch (post.type) {
    case 'measurement':
      return <MeasurementCard post={post} context={context} />;
    case 'image_embed':
      return <ImageEmbedCard post={post} context={context} />;
    case 'youtube':
      return <YoutubeCard post={post} context={context} />;
    case 'link':
      return <LinkCard post={post} context={context} />;
    default:
      return null;
  }
}
