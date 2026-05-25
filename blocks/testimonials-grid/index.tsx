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
    <section className="bg-s-background py-s-section">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-10 text-center sf-heading sf-text-heading">{content.headline}</h2>

        <ul className="grid gap-s-card-gap sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <li key={i} className="flex flex-col justify-between p-6 sf-card">
              <p className="mb-4 italic sf-body text-s-text">&ldquo;{t.text}&rdquo;</p>
              <p className="text-sm font-medium sf-body text-s-muted">— {t.author}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
