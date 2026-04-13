import { createFileRoute, Link, notFound, getRouteApi } from '@tanstack/react-router';
import { Button } from '#/components/ui/button';
import { PostCard } from '#/components/PostCard';
import { getPostByDocumentId } from '#/data/server-functions/posts';

const rootApi = getRouteApi('__root__');

export const Route = createFileRoute('/post/$documentId')({
  loader: async ({ params }) => {
    const post = await getPostByDocumentId({
      data: { documentId: params.documentId },
    });
    if (!post) throw notFound();
    return { post };
  },
  component: SinglePostPage,
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.post?.linkTitle
          ? `${loaderData.post.linkTitle} · Health`
          : loaderData?.post?.caption
            ? `${loaderData.post.caption.slice(0, 50)} · Health`
            : 'Post · Health',
      },
    ],
  }),
  notFoundComponent: NotFoundPost,
});

function SinglePostPage() {
  const { post } = Route.useLoaderData();
  const { me } = rootApi.useLoaderData();
  const myProfileId = me?.profile?.documentId ?? null;

  return (
    <main className="page-wrap flex justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-xl">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink-muted)]">
          Single post
        </p>
        <div className="mt-4">
          <PostCard post={post} currentUserProfileDocumentId={myProfileId} />
        </div>
        <div className="mt-8 flex justify-center">
          <Button
            asChild
            variant="outline"
            className="h-10 rounded-full border-[var(--line)] bg-[var(--card)] px-5 text-sm hover:bg-[var(--bg-subtle)]"
          >
            <Link to="/">Back to feed</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

function NotFoundPost() {
  return (
    <main className="page-wrap flex min-h-[60vh] items-center justify-center px-4 py-14">
      <div className="rise-in mx-auto max-w-md rounded-2xl border border-[var(--line)] bg-[var(--card)] p-10 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink-muted)]">
          Not found
        </p>
        <h1 className="display-title mt-2 text-3xl text-[var(--ink)]">
          That post is gone.
        </h1>
        <p className="mt-3 text-sm text-[var(--ink-soft)]">
          It may have been deleted, hidden for review, or the link is wrong.
        </p>
        <Button
          asChild
          className="mt-6 h-10 rounded-full bg-[var(--ink)] px-5 text-sm hover:bg-[var(--ink-soft)]"
        >
          <Link to="/">Back to feed</Link>
        </Button>
      </div>
    </main>
  );
}
