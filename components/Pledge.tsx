export function Pledge() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-[1180px] px-6 py-20 md:px-10 md:py-28">
        <div className="grid items-center gap-10 md:grid-cols-12">
          <div className="md:col-span-2">
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-honey-700">
              / our pledge
            </div>
          </div>
          <blockquote className="font-serif text-[30px] font-light leading-[1.15] tracking-[-0.015em] text-ink-900 md:col-span-10 md:text-[44px]">
            <span className="text-honey-500">&ldquo;</span>You own your business, your customers,
            your money.{' '}
            <em className="italic text-honey-700">We never take a cut of your sales.</em>
            <span className="text-honey-500">&rdquo;</span>
          </blockquote>
        </div>
        <div className="honey-rule mt-12" />
      </div>
    </section>
  );
}
