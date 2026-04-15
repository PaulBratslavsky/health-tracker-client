import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/about')({
  component: About,
  head: () => ({ meta: [{ title: 'About · Health' }] }),
})

function About() {
  return (
    <main className="page-wrap px-4 py-14 sm:py-20">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--card)] px-3 py-1 text-xs font-medium text-[var(--ink-muted)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
        About
      </span>
      <h1 className="display-title mt-5 max-w-3xl text-4xl text-[var(--ink)] sm:text-6xl">
        A different way to track wellness.
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--ink-soft)] sm:text-lg">
        Health is a small social network centered on one number — your
        waist-to-height ratio (WHtR). The research is clear: WHtR predicts
        cardiometabolic risk better than BMI, across every age, sex, and
        ethnicity. The benchmark is simple — keep your waist under half your
        height.
      </p>

      <section className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <Feature
          kicker="One number"
          title="Waist ÷ Height"
          body="Measure waist with a soft tape at the navel. Divide by height. That's your WHtR. Lower is healthier. Under 0.5 is the target."
        />
        <Feature
          kicker="NICE 2022 bands"
          title="Healthy / Take care / Take action"
          body="0.40 – 0.49 is the healthy range (no increased risk). 0.50 – 0.59 means increased central adiposity — take care. 0.60 or more means high central adiposity — take action. Under 0.40 is below the healthy range and also warrants attention."
        />
        <Feature
          kicker="No hosted content"
          title="Curate, don't upload"
          body="Share articles, YouTube videos, or external images — we link, we don't host. Your photos stay on your phone; your journey stays yours."
        />
        <Feature
          kicker="Share honestly"
          title="Check in, not perform"
          body="Post your measurement. Good week or bad. The feed isn't a highlight reel; it's a progress log. Showing up is the whole point."
        />
        <Feature
          kicker="Your history"
          title="Chart, don't guess"
          body="See your WHtR over time with a simple line chart. Filter by 7 days, 30 days, a year, or all time. Watch yourself move."
        />
        <Feature
          kicker="Moderated gently"
          title="Reports + reputation"
          body="A report button on every post. Three reports auto-hide a post for human review. Bad actors lose posting privileges. The feed stays kind."
        />
      </section>

      <div className="mt-20 flex flex-wrap gap-3">
        <Button
          asChild
          className="h-11 rounded-full bg-[var(--ink)] px-6 text-sm font-medium hover:bg-[var(--ink-soft)]"
        >
          <Link to="/sign-up">Get started</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-11 rounded-full border-[var(--line)] bg-[var(--card)] px-6 text-sm font-medium text-[var(--ink)] hover:bg-[var(--bg-subtle)]"
        >
          <Link to="/feed">See the feed</Link>
        </Button>
      </div>
    </main>
  )
}

function Feature({
  kicker,
  title,
  body,
}: {
  kicker: string
  title: string
  body: string
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
        {kicker}
      </p>
      <h3 className="mt-2 text-xl font-semibold tracking-tight text-[var(--ink)]">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{body}</p>
    </div>
  )
}
