import { createFileRoute, Link } from '@tanstack/react-router';
import { SignInForm } from '#/components/SignInForm';

export const Route = createFileRoute('/sign-in')({
  component: SignInPage,
  head: () => ({ meta: [{ title: 'Sign in · Health' }] }),
});

function SignInPage() {
  return (
    <main className="page-wrap flex min-h-[70vh] items-center justify-center px-4 py-14">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="display-title text-4xl text-[var(--ink)]">Welcome back</h1>
          <p className="mt-3 text-[15px] text-[var(--ink-muted)]">
            Sign in to post and follow your progress.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 sm:p-8">
          <SignInForm />
        </div>
        <p className="mt-6 text-center text-sm text-[var(--ink-muted)]">
          Don&rsquo;t have an account?{' '}
          <Link to="/sign-up" className="font-medium text-[var(--ink)] underline decoration-[var(--line-strong)] underline-offset-4">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
