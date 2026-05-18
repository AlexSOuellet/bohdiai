/* eslint-disable */
const { useState, useEffect, useRef, useMemo } = React;

/* ──────────────────────────────────────────────────────────
   Logo — a quiet "B" set in serif, with a honey leaf accent
   ────────────────────────────────────────────────────────── */
function BohdiLogo({ size = 28, tone = 'ink' }) {
  const ink = tone === 'cream' ? '#fbf8f2' : '#1f1a14';
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="15" fill="none" stroke={ink} strokeWidth="1.25" />
        <path d="M11 9 v14 h7 a4 4 0 0 0 0 -8 h-7 m0 0 h6 a3.5 3.5 0 0 0 0 -7 h-6"
              fill="none" stroke={ink} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx="24" cy="9" r="2.4" fill="#d99634" />
      </svg>
      <span className="font-serif text-[20px] leading-none tracking-[-0.01em]" style={{ color: ink }}>
        Bohdi<span style={{ color: '#d99634' }}>AI</span>
      </span>
    </span>
  );
}

/* ──────────────────────────────────────────────────────────
   Header — logo + login (placeholder) + small CTA
   ────────────────────────────────────────────────────────── */
function Header() {
  return (
    <header className="relative z-20">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 pt-6 md:pt-8 flex items-center justify-between">
        <a href="#top" className="focus-ring rounded">
          <BohdiLogo />
        </a>
        <nav className="flex items-center gap-2 md:gap-6 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-600">
          <a href="#how" className="hidden md:inline link-underline">How it works</a>
          <a href="#community" className="hidden md:inline link-underline">Community</a>
          <a
            href="#login"
            onClick={(e) => { e.preventDefault(); }}
            className="px-3 py-2 rounded-full border border-ink-900/15 hover:border-ink-900/40 transition-colors text-ink-800"
          >
            Log in
          </a>
        </nav>
      </div>
    </header>
  );
}

/* ──────────────────────────────────────────────────────────
   Hero — tagline, rotating business types, teaser line
   ────────────────────────────────────────────────────────── */
const BUSINESS_TYPES = [
  'a candle maker',
  'a sourdough baker',
  'a vintage seller',
  'an estate sale organizer',
  'a farm stand',
  'a dog walker',
  'a ceramic studio',
  'a jewelry artist',
  'a piano teacher',
  'a soap maker',
];

function Hero({ onJumpToForm }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % BUSINESS_TYPES.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <section id="top" className="relative">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 pt-16 md:pt-24 pb-16 md:pb-24">
        <div className="grid md:grid-cols-12 gap-10 md:gap-12 items-end">
          <div className="md:col-span-8 rise">
            <div className="flex items-center gap-3 mb-7 md:mb-9">
              <span className="pill"><span className="dot" />Beta opening · Summer 2026</span>
              <span className="hidden md:inline font-mono text-[11px] uppercase tracking-[0.12em] text-ink-500">bohdi.ai</span>
            </div>
            <h1 className="font-serif font-light text-[44px] sm:text-[64px] md:text-[88px] leading-[0.95] tracking-[-0.025em] text-ink-900">
              Your business <br className="hidden sm:block" />
              online. <em className="font-serif italic font-light text-honey-600">Finally</em><br className="hidden sm:block" /> made easy.
            </h1>
            <div className="mt-8 md:mt-10 max-w-[640px]">
              <p className="text-[19px] md:text-[22px] leading-[1.45] text-ink-700 font-light">
                Tell BohdiAI you&rsquo;re{' '}
                <span className="relative inline-block align-baseline min-w-[12ch]">
                  <span
                    key={idx}
                    className="text-ink-900 font-medium"
                    style={{ animation: 'fadeSwap 2.2s ease-in-out both' }}
                  >
                    {BUSINESS_TYPES[idx]}
                  </span>
                </span>
                {' '}— and a professional storefront, built for the way <em>your</em> business actually works, goes live in minutes.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onJumpToForm('beta')}
                className="btn-primary focus-ring px-7 py-4 rounded-full text-[15px] font-medium tracking-[-0.005em]"
              >
                Request beta access &nbsp;→
              </button>
              <button
                onClick={() => onJumpToForm('waitlist')}
                className="px-7 py-4 rounded-full text-[15px] font-medium text-ink-900 border border-ink-900/20 hover:border-ink-900/60 transition-colors focus-ring"
              >
                Join the waitlist
              </button>
            </div>

            <div className="mt-8 flex items-center gap-5 text-[13px] text-ink-500 font-mono uppercase tracking-[0.1em]">
              <span className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7l3.5 3.5L12 4" fill="none" stroke="#d99634" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
                No code
              </span>
              <span className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7l3.5 3.5L12 4" fill="none" stroke="#d99634" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
                You keep 100%
              </span>
              <span className="hidden sm:flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7l3.5 3.5L12 4" fill="none" stroke="#d99634" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Live in minutes
              </span>
            </div>
          </div>

          {/* Right column — illustrative storefront card stack */}
          <div className="md:col-span-4 rise" style={{ animationDelay: '0.15s' }}>
            <StorefrontStack />
          </div>
        </div>
      </div>
    </section>
  );
}

/* Decorative storefront preview — abstract, not a real shot */
function StorefrontStack() {
  return (
    <div className="relative h-[360px] md:h-[440px]">
      {/* back card — service provider */}
      <div className="absolute right-8 top-2 w-[78%] rotate-[3.5deg] bg-cream-50 border border-cream-300 rounded-2xl p-5 shadow-[0_30px_60px_-30px_rgba(31,26,20,0.25)]">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
          <span>maple st. piano</span>
          <span className="text-honey-600">●</span>
        </div>
        <div className="mt-3 h-24 rounded-md bg-gradient-to-br from-cream-200 to-cream-100 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center text-ink-400 font-mono text-[10px] uppercase tracking-[0.18em]">Hero photo</div>
        </div>
        <div className="mt-3 font-serif text-[18px] leading-tight text-ink-900">Lessons for kids &amp; grown-ups</div>
        <div className="mt-1 text-[12px] text-ink-500">Tue · Thu &nbsp;·&nbsp; In-home or studio</div>
      </div>

      {/* mid card — bakery */}
      <div className="absolute left-0 top-16 w-[82%] -rotate-[2.5deg] bg-white border border-cream-300 rounded-2xl p-5 shadow-[0_40px_80px_-30px_rgba(31,26,20,0.35)]">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
          <span>june's sourdough</span>
          <span>est. 2024</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {['Country', 'Seeded', 'Cinnamon'].map((t, i) => (
            <div key={t} className="aspect-square rounded-md bg-cream-100 border border-cream-200 flex flex-col items-center justify-center p-1 text-center">
              <div className="w-7 h-7 rounded-full bg-honey-300/70 border border-honey-400/60 mb-1" />
              <div className="text-[9px] font-mono uppercase tracking-wider text-ink-600">{t}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <div className="font-serif text-[17px] leading-tight text-ink-900">This week&rsquo;s loaves</div>
            <div className="text-[11px] text-ink-500">Pickup Sat · 9–11am</div>
          </div>
          <div className="px-2.5 py-1.5 rounded-full bg-ink-900 text-cream-50 text-[10px] font-mono uppercase tracking-wider">Order</div>
        </div>
      </div>

      {/* front card — vintage */}
      <div className="absolute right-0 bottom-0 w-[70%] rotate-[1.5deg] bg-espresso-900 text-cream-50 rounded-2xl p-5 shadow-[0_40px_80px_-30px_rgba(31,26,20,0.45)]">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-cream-50/60">
          <span>cedar &amp; brass</span>
          <span>vintage</span>
        </div>
        <div className="mt-3 font-serif text-[20px] leading-tight">
          New: 1970s Danish credenza
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-mono text-[11px] text-cream-50/70">$ 1,240 · 1 left</span>
          <span className="text-honey-400 text-[12px]">→</span>
        </div>
      </div>

      {/* tiny floating chip */}
      <div className="absolute -left-2 bottom-8 px-3 py-1.5 rounded-full bg-honey-400 text-ink-900 text-[10px] font-mono uppercase tracking-[0.14em] shadow-lg rotate-[-6deg]">
        Live in 8 min
      </div>
    </div>
  );
}

window.Header = Header;
window.Hero = Hero;
window.BohdiLogo = BohdiLogo;
window.BUSINESS_TYPES = BUSINESS_TYPES;
