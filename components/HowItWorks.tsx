const STEPS = [
  {
    kicker: 'Tell us about you',
    h: 'A short conversation.',
    p: 'Three or four questions — what you make or do, who buys it, how you take payment. No forms to fight with.',
  },
  {
    kicker: 'AI builds your storefront',
    h: 'Made for your trade.',
    p: 'A bakery looks like a bakery. A vintage shop looks like a vintage shop. Estate sales get an event page. The layout fits how your business actually works.',
  },
  {
    kicker: 'You go live',
    h: 'In minutes. Yours forever.',
    p: 'You own the site, the customer list, the payments. We never take a cut of your sales. Edit anything in plain English, any time.',
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how" className="relative">
      <div className="mx-auto max-w-[1180px] px-6 py-20 md:px-10 md:py-28">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-honey-700">
              / how it works
            </div>
            <h2 className="font-serif text-[40px] font-light leading-[1.0] tracking-[-0.02em] text-ink-900 md:text-[52px]">
              The hard part isn&rsquo;t building{' '}
              <em className="italic text-honey-600">your</em> website.
            </h2>
            <p className="mt-5 max-w-[34ch] text-[17px] leading-relaxed text-ink-600">
              It&rsquo;s deciding what goes on it, what to call things, and how to handle the
              awkward parts — pickup windows, custom orders, deposits, sliding-scale prices.
              BohdiAI does that thinking with you.
            </p>
          </div>

          <ol className="grid gap-px overflow-hidden rounded-2xl border border-cream-300 bg-cream-300/60 sm:grid-cols-3 md:col-span-8">
            {STEPS.map((s) => (
              <li key={s.kicker} className="flex flex-col bg-cream-50 p-6 md:p-7">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-500">
                  {s.kicker}
                </span>
                <h3 className="mt-6 font-serif text-[22px] leading-snug tracking-[-0.01em] text-ink-900">
                  {s.h}
                </h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-ink-600">{s.p}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
