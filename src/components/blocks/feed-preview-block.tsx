import { PostCard } from '#/components/PostCard';
import type { StrapiPost } from '#/lib/services/posts';

export interface IFeedPreviewBlock {
  __component: 'blocks.feed-preview';
  id: number;
  eyebrow?: string;
  heading: string;
  description?: string;
  posts: StrapiPost[];
}

export function FeedPreviewBlock({
  eyebrow,
  heading,
  description,
  posts,
}: Readonly<IFeedPreviewBlock>) {
  if (posts.length === 0) return null;

  return (
    <section className="page-wrap px-4 py-16 sm:py-24">
      <header className="mb-10 max-w-2xl">
        {eyebrow && (
          <span className="text-xs font-semibold uppercase tracking-wider text-(--ink-muted)">
            {eyebrow}
          </span>
        )}
        <h2 className="display-title mt-2 text-3xl text-(--ink) sm:text-4xl">{heading}</h2>
        {description && (
          <p className="mt-4 text-base leading-relaxed text-(--ink-soft)">{description}</p>
        )}
      </header>

      <div
        className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3"
        aria-hidden="true"
        inert
      >
        {posts.map((post) => (
          <PostCard key={post.documentId} post={post} currentUserProfileDocumentId={null} />
        ))}
      </div>
    </section>
  );
}
