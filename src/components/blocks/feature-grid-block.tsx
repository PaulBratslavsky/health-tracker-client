export type FeatureCard = {
  id: number;
  icon: string;
  heading: string;
  body: string;
};

export interface IFeatureGridBlock {
  __component: 'blocks.feature-grid';
  id: number;
  eyebrow?: string;
  heading?: string;
  description?: string;
  cards: FeatureCard[];
}

export function FeatureGridBlock({
  eyebrow,
  heading,
  description,
  cards,
}: Readonly<IFeatureGridBlock>) {
  return (
    <section className="page-wrap px-4 py-16 sm:py-24">
      {(eyebrow || heading || description) && (
        <header className="mb-10 max-w-2xl">
          {eyebrow && (
            <span className="text-xs font-semibold uppercase tracking-wider text-(--ink-muted)">
              {eyebrow}
            </span>
          )}
          {heading && (
            <h2 className="display-title mt-2 text-3xl text-(--ink) sm:text-4xl">
              {heading}
            </h2>
          )}
          {description && (
            <p className="mt-4 text-base leading-relaxed text-(--ink-soft)">{description}</p>
          )}
        </header>
      )}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.id}
            className="rounded-2xl border border-(--line) bg-(--card) p-6 transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(9,9,11,0.04),0_12px_32px_rgba(9,9,11,0.06)]"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-(--bg-subtle) text-lg"
              aria-hidden="true"
            >
              {card.icon}
            </div>
            <h3 className="mt-5 text-lg font-semibold text-(--ink)">{card.heading}</h3>
            <p className="mt-2 text-sm leading-relaxed text-(--ink-soft)">{card.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
