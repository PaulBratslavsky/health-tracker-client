import { createFileRoute, Link, getRouteApi } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { PostCard } from '#/components/PostCard'
import { getFeed } from '#/data/server-functions/posts'

const rootApi = getRouteApi('__root__')

export const Route = createFileRoute('/feed')({
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
        <span className="inline-flex items-center gap-1.5 rounded-full border border-(--line) bg-(--card) px-3 py-1 text-xs font-medium text-(--ink-muted)">
          <span className="h-1.5 w-1.5 rounded-full bg-(--accent)" />
          Global feed
        </span>
        <h1 className="display-title mt-5 max-w-3xl text-[2.75rem] text-(--ink) sm:text-[4rem] lg:text-[5.5rem]">
          Track your ratio,
          <br />
          <span className="text-(--ink-muted)">grow together.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-(--ink-soft) sm:text-lg">
          Every post centers one number — your WHtR. Lower is healthier. The
          benchmark is <span className="font-semibold text-(--ink)">under 0.5</span>.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild size="pill">
            <Link to={me ? '/new-post' : '/sign-up'}>
              {me ? 'New post' : 'Get started'}
            </Link>
          </Button>
          <Button asChild size="pill" variant="outline">
            <Link to="/me">My history</Link>
          </Button>
        </div>
      </section>

      {posts.length === 0 ? (
        <EmptyFeed isAuthed={Boolean(me)} />
      ) : (
        <>
          <header className="mb-6 flex items-end justify-between">
            <h2 className="display-title text-2xl text-(--ink) sm:text-3xl">
              Latest check-ins
            </h2>
            <span className="text-sm font-medium text-(--ink-muted)">
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

function EmptyFeed({ isAuthed }: Readonly<{ isAuthed: boolean }>) {
  return (
    <section className="mx-auto max-w-lg rounded-2xl border border-(--line) bg-(--card) p-10 text-center">
      <p className="text-xs font-medium uppercase tracking-wide text-(--ink-muted)">
        Quiet here
      </p>
      <h2 className="display-title mt-2 text-3xl text-(--ink)">
        No check-ins yet.
      </h2>
      <p className="mt-3 text-sm text-(--ink-soft)">
        {isAuthed
          ? 'Be the first to post. Add your height in your profile, then share a number.'
          : 'Sign in to see the feed and post your own check-ins.'}
      </p>
      <div className="mt-6 flex justify-center gap-2">
        {isAuthed ? (
          <Button asChild size="pill">
            <Link to="/new-post">New post</Link>
          </Button>
        ) : (
          <>
            <Button asChild size="pill" variant="outline">
              <Link to="/sign-in">Sign in</Link>
            </Button>
            <Button asChild size="pill">
              <Link to="/sign-up">Sign up</Link>
            </Button>
          </>
        )}
      </div>
    </section>
  )
}
