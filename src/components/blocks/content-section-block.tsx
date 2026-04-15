export type ContentParagraph = {
  id: number;
  text: string;
};

export type ContentLink = {
  id: number;
  label: string;
  href: string;
};

export interface IContentSectionBlock {
  __component: 'blocks.content-section';
  id: number;
  eyebrow?: string;
  heading: string;
  paragraphs: ContentParagraph[];
  footnote?: string;
  links?: ContentLink[];
}

export function ContentSectionBlock({
  eyebrow,
  heading,
  paragraphs,
  footnote,
  links,
}: Readonly<IContentSectionBlock>) {
  return (
    <section className="page-wrap px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl">
        {eyebrow && (
          <span className="text-xs font-semibold uppercase tracking-wider text-(--ink-muted)">
            {eyebrow}
          </span>
        )}
        <h2 className="display-title mt-2 text-3xl text-(--ink) sm:text-4xl">{heading}</h2>
        <div className="mt-6 space-y-5 text-base leading-relaxed text-(--ink-soft)">
          {paragraphs.map((p) => (
            <p key={p.id}>{p.text}</p>
          ))}
        </div>
        {footnote && (
          <p className="mt-6 border-l-2 border-(--line-strong) pl-4 text-sm italic text-(--ink-muted)">
            {footnote}
          </p>
        )}
        {links && links.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            {links.map((link) => {
              const isExternal = /^https?:\/\//i.test(link.href);
              return (
                <a
                  key={link.id}
                  href={link.href}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noreferrer noopener' : undefined}
                  className="inline-flex items-center gap-1 font-medium text-(--ink) underline-offset-4 hover:text-(--accent) hover:underline"
                >
                  {link.label}
                  {isExternal && (
                    <svg
                      viewBox="0 0 16 16"
                      width="12"
                      height="12"
                      aria-hidden="true"
                      className="opacity-60"
                    >
                      <path
                        fill="currentColor"
                        d="M6 2h8v8h-1.5V4.56L5.03 12.03 3.97 10.97l7.47-7.47H6V2z"
                      />
                    </svg>
                  )}
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
