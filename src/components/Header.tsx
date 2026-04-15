import { Link, getRouteApi, useRouter } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { logoutUser } from '#/data/server-functions/auth'
import { isPremium } from '#/lib/premium'
import ThemeToggle from './ThemeToggle'

const rootApi = getRouteApi('__root__')

export default function Header() {
  const { me } = rootApi.useLoaderData()
  const router = useRouter()

  const handleSignOut = async () => {
    await logoutUser()
    await router.invalidate()
    router.navigate({ to: '/' })
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--header-bg)] backdrop-blur-lg">
      <nav className="page-wrap flex items-center gap-3 py-3 sm:py-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 no-underline"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ink)] text-[var(--card)]">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21s-7-4.5-7-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.5-7 11-7 11" />
            </svg>
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-[var(--ink)]">
            Health
          </span>
        </Link>

        {/* Desktop nav — hidden on mobile; mobile uses the bottom nav */}
        <div className="ml-auto hidden items-center gap-5 md:flex">
          <Link
            to="/"
            className="nav-link text-sm"
            activeProps={{ className: 'nav-link is-active text-sm' }}
          >
            Feed
          </Link>
          {me && (
            <>
              <Link
                to="/new-post"
                className="nav-link text-sm"
                activeProps={{ className: 'nav-link is-active text-sm' }}
              >
                New post
              </Link>
              <Link
                to="/me"
                className="nav-link text-sm"
                activeProps={{ className: 'nav-link is-active text-sm' }}
              >
                My history
              </Link>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <ThemeToggle />

          {me ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-8 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--card)] px-2.5 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--bg-subtle)]"
                  title={isPremium(me.profile) ? 'Health Pro member' : undefined}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[0.6rem] font-semibold text-[var(--ink-soft)]">
                    {(me.profile?.displayName ?? me.username).slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline text-[13px]">
                    {me.profile?.displayName ?? me.username}
                  </span>
                  {isPremium(me.profile) && (
                    <svg
                      viewBox="0 0 16 16"
                      width="13"
                      height="13"
                      aria-label="Pro member"
                      className="text-[var(--mustard-deep)]"
                    >
                      <path
                        fill="currentColor"
                        d="M8 1.5l1.95 3.95 4.35.63-3.15 3.07.74 4.33L8 11.44l-3.89 2.04.74-4.33L1.7 6.08l4.35-.63L8 1.5z"
                      />
                    </svg>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="flex items-center justify-between gap-2 text-xs font-medium text-[var(--ink-muted)]">
                  <span className="truncate">{me.username}</span>
                  {isPremium(me.profile) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--band-yellow-bg)] px-1.5 py-px text-[0.55rem] font-semibold uppercase tracking-wider text-[var(--band-yellow-text)]">
                      Pro
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/me">My history</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/new-post">New post</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleSignOut}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" asChild className="h-8 rounded-full text-[13px]">
                <Link to="/sign-in">Sign in</Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="h-8 rounded-full bg-[var(--ink)] px-4 text-[13px] hover:bg-[var(--ink-soft)]"
              >
                <Link to="/sign-up">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
