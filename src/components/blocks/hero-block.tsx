export type HeroLink = {
  id: number;
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
};

export interface IHeroBlock {
  __component: 'blocks.hero';
  id: number;
  eyebrow?: string;
  heading: string;
  highlightedText?: string;
  description: string;
  links: HeroLink[];
}

export function HeroBlock({
  eyebrow,
  heading,
  highlightedText,
  description,
  links,
}: Readonly<IHeroBlock>) {
  return (
    <section className="page-wrap px-4 pb-16 pt-16 sm:pt-24">
      {eyebrow && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-(--line) bg-(--card) px-3 py-1 text-xs font-medium text-(--ink-muted)">
          <span className="h-1.5 w-1.5 rounded-full bg-(--accent)" />
          {eyebrow}
        </span>
      )}
      <h1 className="display-title mt-5 w-full text-balance text-[2.75rem] text-(--ink) sm:text-[4rem] lg:text-[5.5rem]">
        {heading}
        {highlightedText && (
          <>
            {' '}
            <span className="text-(--ink-muted)">{highlightedText}</span>
          </>
        )}
      </h1>
      <p className="mt-5 max-w-xl text-base leading-relaxed text-(--ink-soft) sm:text-lg">
        {description}
      </p>
      {links.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {links.map((link) => (
            <a
              key={link.id}
              href={link.href}
              className={
                link.variant === 'secondary'
                  ? 'inline-flex h-10 items-center rounded-full border border-(--line) bg-(--card) px-5 text-sm font-medium text-(--ink) transition hover:bg-(--bg-subtle)'
                  : 'inline-flex h-10 items-center rounded-full bg-(--ink) px-5 text-sm font-medium text-white transition hover:bg-(--ink-soft)'
              }
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
