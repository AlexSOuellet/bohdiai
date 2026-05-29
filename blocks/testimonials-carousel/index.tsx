import meta from './meta';
import ScrollReveal from '@/components/storefront/ScrollReveal';

export { meta };

interface TestimonialsCarouselContent {
  eyebrow?: string;
  headline?: string;
  quote_1: string; author_1: string; context_1?: string;
  quote_2: string; author_2: string; context_2?: string;
  quote_3: string; author_3: string; context_3?: string;
  quote_4?: string; author_4?: string; context_4?: string;
  quote_5?: string; author_5?: string; context_5?: string;
}

interface TestimonialsCarouselProps {
  content: TestimonialsCarouselContent;
}

interface Card {
  quote: string;
  author: string;
  context: string | undefined;
}

export default function TestimonialsCarousel({ content }: TestimonialsCarouselProps) {
  const { eyebrow, headline } = content;

  const raw: Array<{ q: string | undefined; a: string | undefined; c: string | undefined }> = [
    { q: content.quote_1, a: content.author_1, c: content.context_1 },
    { q: content.quote_2, a: content.author_2, c: content.context_2 },
    { q: content.quote_3, a: content.author_3, c: content.context_3 },
    { q: content.quote_4, a: content.author_4, c: content.context_4 },
    { q: content.quote_5, a: content.author_5, c: content.context_5 },
  ];

  const cards: Card[] = raw
    .filter((r): r is { q: string; a: string; c: string | undefined } => r.q !== undefined && r.q !== '' && r.a !== undefined && r.a !== '')
    .map((r) => ({ quote: r.q, author: r.a, context: r.c }));

  if (cards.length === 0) return null;

  return (
    <section className="relative w-full bg-s-background py-s-section sf-noise-grain overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 md:mb-12">
          <ScrollReveal delay={0.05}>
            {eyebrow !== undefined && eyebrow !== '' && (
              <p className="mb-4 font-s-body text-[0.7rem] uppercase tracking-[0.28em] text-s-accent font-bold">
                {eyebrow}
              </p>
            )}
            {headline !== undefined && headline !== '' && (
              <h2 className="sf-heading sf-text-heading text-s-text">{headline}</h2>
            )}
          </ScrollReveal>
        </div>
      </div>

      {/* Horizontal scroll row. Cards extend past max-width on purpose so the
          row reads as scrollable — the last visible card is partial on the
          right edge. */}
      <div className="overflow-x-auto overflow-y-hidden pb-6 snap-x snap-mandatory scroll-px-6 [scrollbar-width:thin]">
        <ul className="flex gap-4 md:gap-6 px-6 md:px-[calc((100vw-1280px)/2+1.5rem)] w-max">
          {cards.map((c, i) => (
            <li
              key={i}
              className="snap-start shrink-0 w-[85vw] sm:w-[60vw] md:w-[480px] lg:w-[520px] bg-s-surface border border-s-border rounded-s-card p-8 md:p-10 flex flex-col"
            >
              <p className="text-s-accent text-4xl leading-none mb-4" aria-hidden="true">&ldquo;</p>
              <blockquote className="font-s-heading font-light text-s-text text-lg md:text-xl leading-snug mb-8 flex-1">
                {c.quote}
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-8 h-px bg-s-accent" aria-hidden="true" />
                <p className="font-s-body text-s-text font-medium">{c.author}</p>
                {c.context !== undefined && c.context !== '' && (
                  <>
                    <span className="text-s-muted" aria-hidden="true">·</span>
                    <p className="font-s-body text-s-muted text-sm">{c.context}</p>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
