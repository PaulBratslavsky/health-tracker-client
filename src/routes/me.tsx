import { useState, useTransition } from 'react';
import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import { Button } from '#/components/ui/button';
import { Card, CardContent } from '#/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar';
import { PostCard } from '#/components/PostCard';
import { ProfileEditForm } from '#/components/ProfileEditForm';
import { WhtrChart } from '#/components/WhtrChart';
import { getCurrentUser } from '#/data/server-functions/auth';
import { getMyPosts, getMyMeasurements } from '#/data/server-functions/posts';
import { strapiAssetUrl, type StrapiPost } from '#/lib/services/posts';
import { formatTier, isPremium } from '#/lib/premium';

const DEFAULT_DAYS = 30;

export const Route = createFileRoute('/me')({
  loader: async () => {
    const me = await getCurrentUser();
    if (!me) throw redirect({ to: '/sign-in' });
    if (!me.profile) {
      throw new Error(
        'Your account has no profile linked. Sign out and back in to fix it.',
      );
    }
    const [posts, measurements] = await Promise.all([
      getMyPosts({ data: { type: 'all' } }),
      getMyMeasurements({ data: { days: DEFAULT_DAYS } }),
    ]);
    return { me, profile: me.profile, posts, measurements };
  },
  component: MyHistoryPage,
  head: () => ({ meta: [{ title: 'My history · Health' }] }),
});

type PostTypeFilter = 'all' | 'measurement' | 'link' | 'image_embed' | 'youtube';

const POST_TYPE_FILTERS: Array<{ id: PostTypeFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'measurement', label: 'Check-ins' },
  { id: 'link', label: 'Links' },
  { id: 'image_embed', label: 'Photos' },
  { id: 'youtube', label: 'Videos' },
];

function MyHistoryPage() {
  const {
    profile,
    posts: initialPosts,
    measurements,
  } = Route.useLoaderData();
  const [editing, setEditing] = useState(false);
  const [posts, setPosts] = useState<StrapiPost[]>(initialPosts);
  const [typeFilter, setTypeFilter] = useState<PostTypeFilter>('all');
  const [isPending, startTransition] = useTransition();
  const avatarUrl = strapiAssetUrl(profile.avatar?.url ?? null);
  const initial = profile.displayName.slice(0, 1).toUpperCase();

  const handleTypeFilter = (next: PostTypeFilter) => {
    if (next === typeFilter) return;
    setTypeFilter(next);
    startTransition(async () => {
      const result = await getMyPosts({ data: { type: next } });
      setPosts(result);
    });
  };

  const isFrozen =
    profile.postingStatus === 'frozen' &&
    profile.frozenUntil != null &&
    new Date(profile.frozenUntil).getTime() > Date.now();
  const frozenHoursLeft = profile.frozenUntil
    ? Math.ceil((new Date(profile.frozenUntil).getTime() - Date.now()) / (60 * 60 * 1000))
    : 0;

  return (
    <main className="page-wrap px-4 pb-12 pt-10">
      {isFrozen && (
        <div className="rise-in mb-6 rounded-2xl border border-[var(--band-yellow-bg)] bg-[var(--band-yellow-bg)] p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--band-yellow-text)]">
            Account frozen
          </p>
          <h2 className="mt-1 text-base font-semibold text-[var(--band-yellow-text)]">
            Your posting is temporarily paused.
          </h2>
          <p className="mt-1 text-sm text-[var(--band-yellow-text)]/85">
            Enough reports were upheld against your recent posts to trigger a cooldown. You can
            read the feed normally; new posts will be blocked for about {frozenHoursLeft}h.
            Current reputation:{' '}
            <span className="font-semibold">{profile.reputationScore ?? 100}</span>/100.
          </p>
        </div>
      )}
      <Card className="rise-in mb-10 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-0 shadow-none">
        <CardContent className="flex flex-col gap-5 px-5 py-6 sm:flex-row sm:items-center sm:px-6">
          <Avatar className="h-16 w-16">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={profile.displayName} /> : null}
            <AvatarFallback className="bg-[var(--bg-subtle)] text-lg font-medium text-[var(--ink-soft)]">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink-muted)]">
              Your history
            </p>
            <h1 className="display-title mt-1 text-3xl text-[var(--ink)] sm:text-4xl">
              {profile.displayName}
            </h1>
            {profile.bio ? (
              <p className="mt-2 text-sm text-[var(--ink-soft)]">{profile.bio}</p>
            ) : null}
            <p className="mt-1 text-xs text-[var(--ink-muted)]">
              Current height: {profile.heightCm ? `${profile.heightCm} cm` : 'not set'}
            </p>
            <p className="mt-1 flex items-center gap-2 text-xs text-[var(--ink-muted)]">
              Plan:
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide ${
                  isPremium(profile)
                    ? 'bg-[var(--band-yellow-bg)] text-[var(--band-yellow-text)]'
                    : 'bg-[var(--bg-subtle)] text-[var(--ink-soft)]'
                }`}
              >
                {formatTier(profile)}
              </span>
              {!isPremium(profile) && (
                <Link
                  to="/upgrade"
                  className="text-[var(--accent)] no-underline hover:underline"
                >
                  Upgrade
                </Link>
              )}
            </p>
          </div>
          <div className="flex flex-shrink-0 gap-2">
            <Button
              variant="outline"
              onClick={() => setEditing((v) => !v)}
              className="h-9 rounded-full border-[var(--line)] bg-[var(--card)] px-4 text-[13px] hover:bg-[var(--bg-subtle)]"
            >
              {editing ? 'Close' : 'Edit profile'}
            </Button>
            <Button
              asChild
              className="h-9 rounded-full bg-[var(--ink)] px-4 text-[13px] hover:bg-[var(--ink-soft)]"
            >
              <Link to="/new-post">New check-in</Link>
            </Button>
          </div>
        </CardContent>
        {editing && (
          <div className="border-t border-[var(--line)] px-5 py-5">
            <ProfileEditForm
              profileDocumentId={profile.documentId}
              initial={{
                displayName: profile.displayName,
                bio: profile.bio,
                heightCm: profile.heightCm,
              }}
              onDone={() => setEditing(false)}
              onCancel={() => setEditing(false)}
            />
          </div>
        )}
      </Card>

      <section className="mb-10">
        <header className="mb-4 flex items-end justify-between">
          <div>
            <p className="island-kicker mb-1">Your progress</p>
            <h2 className="display-title text-2xl text-[var(--ink)] sm:text-3xl">
              WHtR over time
            </h2>
          </div>
        </header>
        <WhtrChart initialMeasurements={measurements} initialDays={DEFAULT_DAYS} />
      </section>

      <section>
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="island-kicker mb-1">Your posts</p>
            <h2 className="display-title text-2xl text-[var(--ink)] sm:text-3xl">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            </h2>
          </div>
        </header>

        <div className="mb-5 flex flex-wrap gap-2">
          {POST_TYPE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => handleTypeFilter(f.id)}
              disabled={isPending}
              className={`pill-chip ${f.id === typeFilter ? 'is-active pill-chip--sage' : ''}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {posts.length === 0 ? (
          <Card className="rise-in mx-auto max-w-xl rounded-2xl border border-[var(--line)] bg-[var(--card)] p-8 text-center shadow-none">
            <p className="text-sm text-[var(--sea-ink-soft)]">
              {typeFilter === 'all'
                ? 'No posts yet.'
                : `No ${POST_TYPE_FILTERS.find((f) => f.id === typeFilter)?.label.toLowerCase()} yet.`}
            </p>
            <Button asChild className="mt-4">
              <Link to="/new-post">
                {typeFilter === 'all' ? 'Create your first post' : 'Create a post'}
              </Link>
            </Button>
          </Card>
        ) : (
          <div
            className={`grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3 ${
              isPending ? 'opacity-60 transition-opacity' : ''
            }`}
          >
            {posts.map((post) => (
              <PostCard
                key={post.documentId}
                post={post}
                currentUserProfileDocumentId={profile.documentId}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
