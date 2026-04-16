import { getRouteApi, Link, useLocation } from '@tanstack/react-router';

const rootApi = getRouteApi('__root__');

// Floating action button for the primary "new post" action, shown only on
// desktop (md+). Mobile uses the bottom-nav Post tab instead. Hidden on the
// /new-post route itself (redundant) and for logged-out visitors.
export function NewPostFab() {
  const { me } = rootApi.useLoaderData();
  const pathname = useLocation({ select: (l) => l.pathname });

  if (!me) return null;
  if (pathname === '/new-post') return null;

  return (
    <Link
      to="/new-post"
      aria-label="New post"
      className="group fixed bottom-6 right-6 z-30 hidden h-14 w-14 items-center justify-center rounded-full bg-[var(--ink)] text-[var(--cream)] shadow-[0_4px_16px_rgba(9,9,11,0.18),0_1px_2px_rgba(9,9,11,0.08)] transition hover:scale-105 hover:bg-[var(--ink-soft)] hover:shadow-[0_6px_24px_rgba(9,9,11,0.22),0_2px_4px_rgba(9,9,11,0.1)] md:flex"
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
      <span className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-[var(--ink)] px-2.5 py-1 text-xs font-medium text-[var(--cream)] opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        New post
      </span>
    </Link>
  );
}
