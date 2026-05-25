import meta from './meta';

export { meta };

interface TestimonialsGridContent {
  headline: string;
  testimonial_1_text: string;
  testimonial_1_author: string;
  testimonial_2_text?: string;
  testimonial_2_author?: string;
  testimonial_3_text?: string;
  testimonial_3_author?: string;
}

interface TestimonialsGridProps {
  content: TestimonialsGridContent;
}

interface Testimonial {
  text: string;
  author: string;
}

export default function TestimonialsGrid({ content }: TestimonialsGridProps) {
  const testimonials: Testimonial[] = [
    { text: content.testimonial_1_text, author: content.testimonial_1_author },
  ];

  if (content.testimonial_2_text !== undefined && content.testimonial_2_author !== undefined) {
    testimonials.push({ text: content.testimonial_2_text, author: content.testimonial_2_author });
  }

  if (content.testimonial_3_text !== undefined && content.testimonial_3_author !== undefined) {
    testimonials.push({ text: content.testimonial_3_text, author: content.testimonial_3_author });
  }

  return (
    <section
      style={{
        backgroundColor: 'var(--color-background)',
        paddingTop: 'var(--spacing-section)',
        paddingBottom: 'var(--spacing-section)',
      }}
    >
      <div className="mx-auto max-w-6xl px-6">
        <h2
          className="mb-10 text-center"
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 'var(--heading-weight)',
            letterSpacing: 'var(--heading-letter-spacing)',
            color: 'var(--color-text)',
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
            lineHeight: '1.2',
          }}
        >
          {content.headline}
        </h2>

        <ul className="grid gap-[var(--card-gap)] sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <li
              key={i}
              className="flex flex-col justify-between p-6"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--card-border-radius)',
                border: '1px solid var(--color-border)',
              }}
            >
              <p
                className="mb-4"
                style={{
                  fontFamily: 'var(--font-body)',
                  lineHeight: 'var(--body-line-height)',
                  color: 'var(--color-text)',
                  fontStyle: 'italic',
                }}
              >
                &ldquo;{t.text}&rdquo;
              </p>
              <p
                className="text-sm font-medium"
                style={{
                  fontFamily: 'var(--font-body)',
                  color: 'var(--color-text-muted)',
                }}
              >
                — {t.author}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
