import { Glyph, type GlyphName } from './Glyph';

const TRADES: { label: string; glyph: GlyphName }[] = [
  { label: 'Bakers', glyph: 'bread' },
  { label: 'Makers & crafters', glyph: 'spool' },
  { label: 'Vintage sellers', glyph: 'tag' },
  { label: 'Estate sale organizers', glyph: 'house' },
  { label: 'Farm stands', glyph: 'leaf' },
  { label: 'Ceramic studios', glyph: 'vase' },
  { label: 'Soap & candle makers', glyph: 'flame' },
  { label: 'Service providers', glyph: 'spark' },
  { label: 'Music teachers', glyph: 'note' },
  { label: 'Florists', glyph: 'flower' },
  { label: 'Jewelry artists', glyph: 'ring' },
  { label: 'Repair & restoration', glyph: 'wrench' },
];

export function Breadth() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-[1180px] px-6 pb-20 md:px-10 md:pb-28">
        <div className="border-t border-ink-900/10 pt-12 md:pt-16">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <h2 className="max-w-[18ch] font-serif text-[32px] font-light leading-[1.05] tracking-[-0.015em] text-ink-900 md:text-[40px]">
              Built for whatever{' '}
              <em className="italic text-honey-600">whatever-you-do</em> is.
            </h2>
            <p className="max-w-[28ch] font-mono text-[11px] uppercase tracking-[0.14em] text-ink-500">
              Not a generic site builder. The layout, language and checkout shift to match your
              trade.
            </p>
          </div>

          <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-cream-300 bg-cream-300/60 sm:grid-cols-3 lg:grid-cols-4">
            {TRADES.map((t) => (
              <li
                key={t.label}
                className="flex items-center gap-3 bg-cream-50 px-5 py-5 transition-colors hover:bg-cream-100"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cream-200 bg-cream-100">
                  <Glyph name={t.glyph} />
                </span>
                <span className="font-serif text-[18px] leading-snug text-ink-900">{t.label}</span>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-[14px] italic text-ink-500">
            …and most anything else a small business does. If you sell it, ship it, deliver it,
            teach it, or rent it — BohdiAI builds the storefront.
          </p>
        </div>
      </div>
    </section>
  );
}
