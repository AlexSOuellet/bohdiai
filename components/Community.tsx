const SKOOL_URL = 'https://www.skool.com/wits-end-breakthrough-7869';

export function Community() {
  return (
    <section id="community" className="relative">
      <div className="mx-auto max-w-[1180px] px-6 pb-20 md:px-10 md:pb-28">
        <article className="card paper-dark grid items-center gap-8 rounded-3xl bg-espresso-900 p-7 text-cream-50 md:grid-cols-12 md:p-10">
          <div className="md:col-span-7">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream-50/60">
                / community · witsend breakthroughs
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-honey-400">
                Open now
              </span>
            </div>
            <h2 className="mt-6 font-serif text-[30px] font-light leading-[1.05] tracking-[-0.015em] md:text-[40px]">
              Start <em className="italic text-honey-300">before</em> the product is out.
            </h2>
            <p className="mt-4 max-w-[52ch] text-[15.5px] leading-relaxed text-cream-50/75">
              Witsend Breakthroughs is the Skool community for small business owners thinking about
              what AI means for their kitchen-table operation. Live weekly sessions, honest
              conversations, and the awkward business stuff nobody else teaches.
            </p>
            <ul className="mt-6 space-y-2.5 text-[14px] text-cream-50/85">
              <BulletDark>Live weekly workshop</BulletDark>
              <BulletDark>Real owners, real questions</BulletDark>
              <BulletDark>Free to join, no pitch</BulletDark>
            </ul>
          </div>
          <div className="md:col-span-5">
            <a
              href={SKOOL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring group inline-flex items-center justify-between gap-4 rounded"
            >
              <span className="border-b border-honey-400/50 pb-0.5 font-serif text-[18px] tracking-tight group-hover:border-honey-400">
                Visit Witsend Breakthroughs on Skool
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-honey-400 text-ink-900 transition-transform group-hover:translate-x-1">
                →
              </span>
            </a>
          </div>
        </article>
      </div>
    </section>
  );
}

function BulletDark({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <svg width="14" height="14" viewBox="0 0 14 14" className="mt-1 shrink-0" aria-hidden="true">
        <path
          d="M2 7l3.5 3.5L12 4"
          fill="none"
          stroke="#f3c97a"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{children}</span>
    </li>
  );
}
