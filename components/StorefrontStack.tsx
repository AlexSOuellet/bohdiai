export function StorefrontStack() {
  return (
    <div className="relative h-[360px] md:h-[440px]" aria-hidden="true">
      <div className="absolute right-8 top-2 w-[78%] rotate-[3.5deg] rounded-2xl border border-cream-300 bg-cream-50 p-5 shadow-[0_30px_60px_-30px_rgba(31,26,20,0.25)]">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
          <span>maple st. piano</span>
          <span className="text-honey-600">●</span>
        </div>
        <div className="relative mt-3 h-24 overflow-hidden rounded-md bg-gradient-to-br from-cream-200 to-cream-100">
          <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">
            Hero photo
          </div>
        </div>
        <div className="mt-3 font-serif text-[18px] leading-tight text-ink-900">
          Lessons for kids &amp; grown-ups
        </div>
        <div className="mt-1 text-[12px] text-ink-500">Tue · Thu · In-home or studio</div>
      </div>

      <div className="absolute left-0 top-16 w-[82%] -rotate-[2.5deg] rounded-2xl border border-cream-300 bg-white p-5 shadow-[0_40px_80px_-30px_rgba(31,26,20,0.35)]">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
          <span>june&rsquo;s sourdough</span>
          <span>est. 2024</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {['Country', 'Seeded', 'Cinnamon'].map((t) => (
            <div
              key={t}
              className="flex aspect-square flex-col items-center justify-center rounded-md border border-cream-200 bg-cream-100 p-1 text-center"
            >
              <div className="mb-1 h-7 w-7 rounded-full border border-honey-400/60 bg-honey-300/70" />
              <div className="font-mono text-[9px] uppercase tracking-wider text-ink-600">{t}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <div className="font-serif text-[17px] leading-tight text-ink-900">
              This week&rsquo;s loaves
            </div>
            <div className="text-[11px] text-ink-500">Pickup Sat · 9–11am</div>
          </div>
          <div className="rounded-full bg-ink-900 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-cream-50">
            Order
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 right-0 w-[70%] rotate-[1.5deg] rounded-2xl bg-espresso-900 p-5 text-cream-50 shadow-[0_40px_80px_-30px_rgba(31,26,20,0.45)]">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-cream-50/60">
          <span>cedar &amp; brass</span>
          <span>vintage</span>
        </div>
        <div className="mt-3 font-serif text-[20px] leading-tight">New: 1970s Danish credenza</div>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-mono text-[11px] text-cream-50/70">$ 1,240 · 1 left</span>
          <span className="text-[12px] text-honey-400">→</span>
        </div>
      </div>

      <div className="absolute -left-2 bottom-8 rotate-[-6deg] rounded-full bg-honey-400 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-900 shadow-lg">
        Live in 8 min
      </div>
    </div>
  );
}
