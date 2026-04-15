import { useState } from 'react';

export type FaqItem = {
  id: number;
  question: string;
  answer: string;
};

export interface IFaqsBlock {
  __component: 'blocks.faqs';
  id: number;
  eyebrow?: string;
  heading: string;
  description?: string;
  items: FaqItem[];
}

export function FaqsBlock({
  eyebrow,
  heading,
  description,
  items,
}: Readonly<IFaqsBlock>) {
  const [openId, setOpenId] = useState<number | null>(items[0]?.id ?? null);
  const toggle = (id: number) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <section className="page-wrap px-4 py-16 sm:py-24">
      <header className="mx-auto mb-10 max-w-2xl text-center">
        {eyebrow && (
          <span className="text-xs font-semibold uppercase tracking-wider text-(--ink-muted)">
            {eyebrow}
          </span>
        )}
        <h2 className="display-title mt-2 text-3xl text-(--ink) sm:text-4xl">{heading}</h2>
        {description && (
          <p className="mt-4 text-base leading-relaxed text-(--ink-soft)">{description}</p>
        )}
      </header>
      <div className="mx-auto max-w-3xl divide-y divide-(--line) rounded-2xl border border-(--line) bg-(--card)">
        {items.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => toggle(item.id)}
                aria-expanded={isOpen}
                aria-controls={`faq-${item.id}`}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-base font-medium text-(--ink) transition hover:bg-(--bg-subtle)"
              >
                <span>{item.question}</span>
                <svg
                  viewBox="0 0 16 16"
                  width="14"
                  height="14"
                  aria-hidden="true"
                  className={`flex-none text-(--ink-muted) transition-transform ${isOpen ? 'rotate-180' : ''}`}
                >
                  <path fill="currentColor" d="M8 11L2 5h12z" />
                </svg>
              </button>
              {isOpen && (
                <div
                  id={`faq-${item.id}`}
                  className="px-6 pb-5 text-sm leading-relaxed text-(--ink-soft)"
                >
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
