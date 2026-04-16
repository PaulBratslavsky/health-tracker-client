import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '#/components/ui/button';

export const Route = createFileRoute('/upgrade')({
  component: UpgradePage,
  head: () => ({ meta: [{ title: 'Upgrade · Health' }] }),
});

function UpgradePage() {
  return (
    <main className="page-wrap flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--card)] px-3 py-1 text-xs font-medium text-[var(--ink-muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--mustard)]" />
          Coming soon
        </span>
        <h1 className="display-title mt-6 text-4xl text-[var(--ink)] sm:text-5xl">
          Health <span className="text-[var(--mustard-deep)]">Pro</span>.
        </h1>
        <p className="mt-5 text-base leading-relaxed text-[var(--ink-soft)] sm:text-lg">
          Pro unlocks photo uploads on your check-ins and helps keep the app
          free from ads and trackers. It's not live yet, but it will be soon.
        </p>

        <ul className="mx-auto mt-10 grid max-w-md gap-3 text-left">
          <Perk>Photo uploads on check-in posts</Perk>
          <Perk>Pro badge on the feed next to your name</Perk>
          <Perk>Early access to features we haven't shipped yet</Perk>
          <Perk>Support an ad-free, privacy-respecting app</Perk>
        </ul>

        <div className="mt-10 flex flex-col items-center gap-3">
          <a
            href="mailto:hello@healthapp.example.com?subject=Interested%20in%20Pro"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--ink)] px-6 text-sm font-medium text-[var(--card)] no-underline hover:bg-[var(--ink-soft)]"
          >
            Email me when Pro launches
          </a>
          <Button asChild size="pill" variant="outline">
            <Link to="/feed">Back to feed</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

function Perk({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--ink-soft)]">
      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--band-green-bg)] text-[var(--band-green-text)]">
        <svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor" aria-hidden="true">
          <path d="M13.5 4.5L6 12 2.5 8.5l1-1L6 10l6.5-6.5z" />
        </svg>
      </span>
      <span>{children}</span>
    </li>
  );
}
