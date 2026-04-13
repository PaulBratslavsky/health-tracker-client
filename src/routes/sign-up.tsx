import { createFileRoute, Link } from '@tanstack/react-router';
import { SignUpForm } from '#/components/SignUpForm';

export const Route = createFileRoute('/sign-up')({
  component: SignUpPage,
  head: () => ({ meta: [{ title: 'Sign up · Health' }] }),
});

function SignUpPage() {
  return (
    <main className="page-wrap flex min-h-[70vh] items-center justify-center px-4 py-14">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="display-title text-4xl text-[var(--ink)]">Create your account</h1>
          <p className="mt-3 text-[15px] text-[var(--ink-muted)]">
            Track your wellness journey, one check-in at a time.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 sm:p-8">
          <SignUpForm />
        </div>
        <p className="mt-6 text-center text-sm text-[var(--ink-muted)]">
          Already have an account?{' '}
          <Link to="/sign-in" className="font-medium text-[var(--ink)] underline decoration-[var(--line-strong)] underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
