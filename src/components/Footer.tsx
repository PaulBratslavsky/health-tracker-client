import { Link } from '@tanstack/react-router'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-24 border-t border-[var(--line)] bg-[var(--card)]">
      <div className="page-wrap flex flex-col gap-8 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:py-14">
        <div className="max-w-sm">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ink)] text-[var(--card)]">
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 21s-7-4.5-7-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.5-7 11-7 11" />
              </svg>
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-[var(--ink)]">
              Health
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
            A small social network for tracking your wellness journey. Every
            post centers one number — your waist-to-height ratio.
          </p>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
              Product
            </span>
            <Link
              to="/"
              className="text-[var(--ink-soft)] no-underline hover:text-[var(--ink)]"
            >
              Feed
            </Link>
            <Link
              to="/new-post"
              className="text-[var(--ink-soft)] no-underline hover:text-[var(--ink)]"
            >
              New post
            </Link>
            <Link
              to="/me"
              className="text-[var(--ink-soft)] no-underline hover:text-[var(--ink)]"
            >
              My history
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
              About
            </span>
            <Link
              to="/about"
              className="text-[var(--ink-soft)] no-underline hover:text-[var(--ink)]"
            >
              About
            </Link>
            <a
              href="https://en.wikipedia.org/wiki/Waist-to-height_ratio"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--ink-soft)] no-underline hover:text-[var(--ink)]"
            >
              What is WHtR?
            </a>
          </div>
        </nav>
      </div>
      <div className="border-t border-[var(--line)]">
        <div className="page-wrap flex items-center justify-between px-4 py-5 text-xs text-[var(--ink-muted)]">
          <span>&copy; {year} Health. All rights reserved.</span>
        </div>
      </div>
    </footer>
  )
}
