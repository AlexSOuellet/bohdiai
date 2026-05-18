export function WhosBehindThis() {
  return (
    <section id="who" className="relative">
      <div className="mx-auto max-w-[1180px] px-6 pb-20 md:px-10 md:pb-28">
        <div className="grid items-start gap-10 md:grid-cols-12">
          <div className="md:col-span-3">
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-honey-700">
              / who&rsquo;s behind this
            </div>
          </div>
          <div className="md:col-span-9">
            <p className="font-serif text-[26px] font-light leading-[1.25] tracking-[-0.01em] text-ink-900 md:text-[32px]">
              I&rsquo;m <strong className="font-medium">Alex Scott</strong>. In the 1990s I ran a
              little shop called <em className="italic">Witsend</em> helping neighbors make sense of
              the home computer.{' '}
              <span className="text-honey-700">
                Thirty years later, the same kind of people are staring down AI — and the
                storefronts that come with it.
              </span>{' '}
              BohdiAI is what I wish they had: an honest tool, built by someone who&rsquo;s actually
              sitting at the kitchen table with them.
            </p>
            <p className="mt-6 max-w-[60ch] text-[15.5px] leading-relaxed text-ink-600">
              No venture-backed army. No revenue cut on your sales. Just a small product, built
              carefully, in the open — and a community where you can ask anything and get a real
              answer.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
