export type CalloutBullet = {
  id: number;
  text: string;
};

export interface IPremiumCalloutBlock {
  __component: 'blocks.premium-callout';
  id: number;
  badge: string;
  heading: string;
  description: string;
  bullets: CalloutBullet[];
  ctaLabel: string;
  ctaHref: string;
}

export function PremiumCalloutBlock({
  badge,
  heading,
  description,
  bullets,
  ctaLabel,
  ctaHref,
}: Readonly<IPremiumCalloutBlock>) {
  return (
    <section className="page-wrap px-4 py-16 sm:py-20">
      <div className="overflow-hidden rounded-3xl border border-(--line) bg-(--card) p-8 sm:p-12">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center rounded-full bg-(--band-yellow-bg) px-3 py-1 text-xs font-semibold uppercase tracking-wider text-(--band-yellow-text)">
              {badge}
            </span>
            <h2 className="display-title mt-4 text-3xl text-(--ink) sm:text-4xl">{heading}</h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-(--ink-soft)">
              {description}
            </p>
            <a
              href={ctaHref}
              className="mt-6 inline-flex h-10 items-center rounded-full bg-(--ink) px-5 text-sm font-medium text-white transition hover:bg-(--ink-soft)"
            >
              {ctaLabel}
            </a>
          </div>
          <ul className="grid gap-3 rounded-2xl bg-(--bg-subtle) p-6 text-sm text-(--ink-soft)">
            {bullets.map((bullet) => (
              <li key={bullet.id} className="flex items-start gap-3">
                <span
                  className="mt-[0.4rem] h-1.5 w-1.5 flex-none rounded-full bg-(--accent)"
                  aria-hidden="true"
                />
                <span>{bullet.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
