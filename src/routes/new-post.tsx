import { createFileRoute, redirect } from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import { NewPostForm } from '#/components/NewPostForm';
import { SetHeightForm } from '#/components/SetHeightForm';
import { getCurrentUser } from '#/data/server-functions/auth';

export const Route = createFileRoute('/new-post')({
  loader: async () => {
    const me = await getCurrentUser();
    if (!me) {
      throw redirect({ to: '/sign-in' });
    }
    if (!me.profile) {
      throw new Error(
        'Your account has no profile linked. Sign out and back in to fix it.',
      );
    }
    return { me, profile: me.profile };
  },
  component: NewPostPage,
  head: () => ({ meta: [{ title: 'New post · Health' }] }),
});

function NewPostPage() {
  const { profile } = Route.useLoaderData();
  const heightCm = profile.heightCm;

  return (
    <main className="page-wrap flex justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-xl">
        <div className="mb-8">
          <h1 className="display-title text-3xl text-[var(--ink)] sm:text-4xl">New post</h1>
          <p className="mt-2 text-[15px] text-[var(--ink-muted)]">
            Share a check-in, an article, an image, or a video.
          </p>
        </div>
        <Card className="rise-in w-full rounded-2xl border border-[var(--line)] bg-[var(--card)] p-0 shadow-none">
          <CardContent className="p-6 sm:p-8">
            <NewPostForm heightCm={heightCm} />
            {!heightCm && (
              <div className="mt-8 border-t border-[var(--line)] pt-6">
                <p className="island-kicker mb-3">Set your height to enable check-ins</p>
                <SetHeightForm profileDocumentId={profile.documentId} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
