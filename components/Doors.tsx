import Link from 'next/link';

/**
 * Two doors under the hero: makers and contractors each get their own page with
 * their own prices (never shown side by side). Charities have no plan yet, so
 * they get a quiet line to the contact form.
 */
const DOORS = [
  {
    href: '/makers',
    title: 'I make things',
    sub: 'Candles, soap, jewelry, baked goods, art. A site for your shop and your market days',
  },
  {
    href: '/contractors',
    title: 'I run a service business',
    sub: 'Lawn care, landscaping, cleaning, handyman work. A site that brings in estimate requests',
  },
] as const;

export function Doors(): React.ReactElement {
  return (
    <section className="relative z-content mx-auto max-w-[1000px] px-4 pt-16 md:pt-24">
      <nav aria-label="Choose your path" className="grid gap-4 md:grid-cols-2 md:gap-6">
        {DOORS.map((d) => (
          <Link
            key={d.href}
            href={d.href}
            className="group relative flex flex-col overflow-hidden rounded-[22px] border border-white/10 p-6 no-underline shadow-[0_40px_90px_-30px_rgba(0,0,0,0.85)] backdrop-blur-[20px] transition-[border-color,transform,box-shadow] duration-slow ease-out [background:linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] hover:-translate-y-1 hover:border-honey-warm/45 hover:shadow-[0_40px_90px_-30px_rgba(0,0,0,0.85),0_0_70px_-20px_rgba(243,201,122,0.4)] md:p-9"
          >
            <span className="font-sans text-[28px] font-medium leading-[1.05] tracking-[-0.025em] text-text transition-colors duration-base group-hover:text-honey-warm md:text-[36px]">
              {d.title}
            </span>
            <span className="mt-3 max-w-[380px] text-[14px] leading-[1.55] text-muted md:text-[15px]">{d.sub}</span>
            <span className="mt-7 inline-flex items-center gap-2 text-[13px] font-semibold text-honey-warm">
              Built free, from $14.99 a month
              <span aria-hidden="true" className="transition-transform duration-base group-hover:translate-x-1">
                →
              </span>
            </span>
          </Link>
        ))}
      </nav>
      <p className="mt-6 text-center text-[14px] text-muted">
        <a
          href="#contact"
          className="text-text-soft underline decoration-honey-warm/40 underline-offset-4 hover:decoration-honey-warm"
        >
          Charity or community group? Let’s talk
        </a>
      </p>
    </section>
  );
}
