import { createFileRoute, Link, getRouteApi } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { PostCard } from '#/components/PostCard'
import { getFeed } from '#/data/server-functions/posts'

const rootApi = getRouteApi('__root__')

export const Route = createFileRoute('/')({
  loader: async () => {
    const posts = await getFeed()
    return { posts }
  },
  component: FeedPage,
})

function FeedPage() {
  const { posts } = Route.useLoaderData()
  const { me } = rootApi.useLoaderData()
  const myProfileId = me?.profile?.documentId ?? null

  return (
    <main className="page-wrap px-4 pb-12 pt-10 sm:pt-14">
      <section className="mb-10 sm:mb-14">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--card)] px-3 py-1 text-xs font-medium text-[var(--ink-muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          Global feed
        </span>
        <h1 className="display-title mt-5 max-w-3xl text-[2.75rem] text-[var(--ink)] sm:text-[4rem] lg:text-[5.5rem]">
          Track your ratio,
          <br />
          <span className="text-[var(--ink-muted)]">grow together.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--ink-soft)] sm:text-lg">
          Every post centers one number — your WHtR. Lower is healthier. The
          benchmark is <span className="font-semibold text-[var(--ink)]">under 0.5</span>.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {me ? (
            <Button asChild className="h-10 rounded-full bg-[var(--ink)] px-5 text-sm font-medium hover:bg-[var(--ink-soft)]">
              <Link to="/new-post">New post</Link>
            </Button>
          ) : (
            <Button asChild className="h-10 rounded-full bg-[var(--ink)] px-5 text-sm font-medium hover:bg-[var(--ink-soft)]">
              <Link to="/sign-up">Get started</Link>
            </Button>
          )}
          <Button
            asChild
            variant="outline"
            className="h-10 rounded-full border-[var(--line)] bg-[var(--card)] px-5 text-sm font-medium text-[var(--ink)] hover:bg-[var(--bg-subtle)]"
          >
            <Link to="/me">My history</Link>
          </Button>
        </div>
      </section>

      {posts.length === 0 ? (
        <EmptyFeed isAuthed={Boolean(me)} />
      ) : (
        <>
          <header className="mb-6 flex items-end justify-between">
            <h2 className="display-title text-2xl text-[var(--ink)] sm:text-3xl">
              Latest check-ins
            </h2>
            <span className="text-sm font-medium text-[var(--ink-muted)]">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            </span>
          </header>
          <section className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard
                key={post.documentId}
                post={post}
                currentUserProfileDocumentId={myProfileId}
              />
            ))}
          </section>
        </>
      )}
    </main>
  )
}

function EmptyFeed({ isAuthed }: { isAuthed: boolean }) {
  return (
    <section className="mx-auto max-w-lg rounded-2xl border border-[var(--line)] bg-[var(--card)] p-10 text-center">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink-muted)]">
        Quiet here
      </p>
      <h2 className="display-title mt-2 text-3xl text-[var(--ink)]">
        No check-ins yet.
      </h2>
      <p className="mt-3 text-sm text-[var(--ink-soft)]">
        {isAuthed
          ? 'Be the first to post. Add your height in your profile, then share a number.'
          : 'Sign in to see the feed and post your own check-ins.'}
      </p>
      <div className="mt-6 flex justify-center gap-2">
        {isAuthed ? (
          <Button asChild className="h-10 rounded-full bg-[var(--ink)] px-5 text-sm">
            <Link to="/new-post">New post</Link>
          </Button>
        ) : (
          <>
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-full border-[var(--line)] bg-[var(--card)] px-5 text-sm"
            >
              <Link to="/sign-in">Sign in</Link>
            </Button>
            <Button asChild className="h-10 rounded-full bg-[var(--ink)] px-5 text-sm">
              <Link to="/sign-up">Sign up</Link>
            </Button>
          </>
        )}
      </div>
    </section>
  )
}
