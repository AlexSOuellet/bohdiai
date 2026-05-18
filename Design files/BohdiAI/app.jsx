/* eslint-disable */
const { useState, useEffect, useRef } = React;

/* ──────────────────────────────────────────────────────────
   How it works — three quiet steps
   ────────────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
  {
    n: '01',
    kicker: 'Tell us about you',
    h: 'A short conversation.',
    p: 'Three or four questions — what you make or do, who buys it, how you take payment. No forms to fight with.'
  },
  {
    n: '02',
    kicker: 'AI builds your storefront',
    h: 'Made for your trade.',
    p: 'A bakery looks like a bakery. A vintage shop looks like a vintage shop. Estate sales get an event page. The layout fits how your business actually works.'
  },
  {
    n: '03',
    kicker: 'You go live',
    h: 'In minutes. Yours forever.',
    p: 'You own the site, the customer list, the payments. We never take a cut of your sales. Edit anything in plain English, any time.'
  }];


  return (
    <section id="how" className="relative">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 py-20 md:py-28">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-honey-700 mb-4">/ how it works</div>
            <h2 className="font-serif font-light text-[40px] md:text-[52px] leading-[1.0] tracking-[-0.02em] text-ink-900">
              The hard part isn&rsquo;t building <em className="italic text-honey-600">your</em> website.
            </h2>
            <p className="mt-5 text-ink-600 text-[17px] leading-relaxed max-w-[34ch]">
              It&rsquo;s deciding what goes on it, what to call things, and how to handle the awkward parts — pickup windows, custom orders, deposits, sliding-scale prices. BohdiAI does that thinking with you.
            </p>
          </div>

          <ol className="md:col-span-8 grid sm:grid-cols-3 gap-px bg-cream-300/60 border border-cream-300 rounded-2xl overflow-hidden">
            {steps.map((s) =>
            <li key={s.n} className="bg-cream-50 p-6 md:p-7 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-500">{s.kicker}</span>
                </div>
                <h3 className="mt-6 font-serif text-[22px] leading-snug text-ink-900 tracking-[-0.01em]">{s.h}</h3>
                <p className="mt-3 text-[14.5px] text-ink-600 leading-relaxed">{s.p}</p>
              </li>
            )}
          </ol>
        </div>
      </div>
    </section>);

}

/* ──────────────────────────────────────────────────────────
   Breadth — who BohdiAI is for
   ────────────────────────────────────────────────────────── */
const TRADES = [
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
{ label: 'Repair & restoration', glyph: 'wrench' }];


function Glyph({ name }) {
  const stroke = '#bf7a1f';
  const props = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke, strokeWidth: '1.5', strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'bread':return <svg {...props}><path d="M4 13c0-4 4-7 8-7s8 3 8 7-3 6-8 6-8-2-8-6z" /><path d="M9 11l-1 5M12 10l0 6M15 11l1 5" /></svg>;
    case 'spool':return <svg {...props}><rect x="5" y="4" width="14" height="16" rx="2" /><path d="M5 9h14M5 15h14" /></svg>;
    case 'tag':return <svg {...props}><path d="M3 12V4h8l10 10-8 8L3 12z" /><circle cx="8" cy="8" r="1.5" /></svg>;
    case 'house':return <svg {...props}><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></svg>;
    case 'leaf':return <svg {...props}><path d="M20 4c-9 0-15 5-15 13 0 2 1 3 3 3 8 0 13-6 13-15z" /><path d="M5 20c4-5 8-9 14-13" /></svg>;
    case 'vase':return <svg {...props}><path d="M8 4h8l-1 3a3 3 0 0 0 1 4v6a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3v-6a3 3 0 0 0 1-4z" /></svg>;
    case 'flame':return <svg {...props}><path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-3 2-6 0 0 2 1 3-4z" /></svg>;
    case 'spark':return <svg {...props}><path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M6 18l3-3M15 9l3-3" /></svg>;
    case 'note':return <svg {...props}><path d="M9 18V5l10-2v13" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="16" r="2" /></svg>;
    case 'flower':return <svg {...props}><circle cx="12" cy="12" r="2.5" /><path d="M12 9.5V5M12 14.5V19M9.5 12H5M14.5 12H19M9 9l-2-2M15 15l2 2M9 15l-2 2M15 9l2-2" /></svg>;
    case 'ring':return <svg {...props}><circle cx="12" cy="15" r="5" /><path d="M9 6l3-2 3 2-1 4h-4z" /></svg>;
    case 'wrench':return <svg {...props}><path d="M14 7a4 4 0 1 0-3 7l-7 7 2 2 7-7a4 4 0 0 0 5-5l-2 2-2-2 2-2z" /></svg>;
    default:return null;
  }
}

function Breadth() {
  return (
    <section className="relative">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 pb-20 md:pb-28">
        <div className="border-t border-ink-900/10 pt-12 md:pt-16">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
            <h2 className="font-serif font-light text-[32px] md:text-[40px] leading-[1.05] tracking-[-0.015em] text-ink-900 max-w-[18ch]">
              Built for whatever <em className="italic text-honey-600">whatever-you-do</em> is.
            </h2>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-500 max-w-[28ch]">
              Not a generic site builder. The layout, language and checkout shift to match your trade.
            </p>
          </div>

          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-cream-300/60 border border-cream-300 rounded-2xl overflow-hidden">
            {TRADES.map((t) =>
            <li key={t.label} className="bg-cream-50 px-5 py-5 flex items-center gap-3 hover:bg-cream-100 transition-colors">
                <span className="w-9 h-9 rounded-full bg-cream-100 border border-cream-200 flex items-center justify-center shrink-0">
                  <Glyph name={t.glyph} />
                </span>
                <span className="font-serif text-[18px] leading-snug text-ink-900">{t.label}</span>
              </li>
            )}
          </ul>

          <p className="mt-6 text-[14px] text-ink-500 italic">…and most anything else a small business does. If you sell it, ship it, deliver it, teach it, or rent it — BohdiAI builds the storefront.</p>
        </div>
      </div>
    </section>);

}

/* ──────────────────────────────────────────────────────────
   Three engagement paths — Beta / Waitlist / Community
   With a working tab switcher between Beta + Waitlist forms.
   ────────────────────────────────────────────────────────── */
function Paths({ tabRef }) {
  const [tab, setTab] = useState('beta'); // 'beta' | 'waitlist'
  const [submitted, setSubmitted] = useState(null); // null | 'beta' | 'waitlist'
  const [betaForm, setBetaForm] = useState({ name: '', email: '', sells: '' });
  const [waitForm, setWaitForm] = useState({ email: '' });
  const [errors, setErrors] = useState({});

  // Allow Hero buttons to switch tabs + scroll
  useEffect(() => {
    if (tabRef) {
      tabRef.current = (which) => {
        setTab(which);
        setSubmitted(null);
        setTimeout(() => {
          document.getElementById('access')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
        }, 0);
      };
    }
  }, [tabRef]);

  const validate = (which) => {
    const e = {};
    const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (which === 'beta') {
      if (!betaForm.name.trim()) e.name = 'Tell us what to call you.';
      if (!emailOk(betaForm.email)) e.email = 'A working email, please.';
      if (!betaForm.sells.trim()) e.sells = 'Even one line is enough.';
    } else {
      if (!emailOk(waitForm.email)) e.email = 'A working email, please.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (which) => (ev) => {
    ev.preventDefault();
    if (!validate(which)) return;
    setSubmitted(which);
  };

  return (
    <section id="access" className="relative">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 py-20 md:py-28">
        <div className="text-center mb-12 md:mb-16">
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-honey-700 mb-3">/ three ways in</div>
          <h2 className="font-serif font-light text-[40px] md:text-[56px] leading-[1.0] tracking-[-0.02em] text-ink-900 max-w-[20ch] mx-auto">
            Pick the door that fits you today.
          </h2>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Beta + Waitlist combined card */}
          <article className="lg:col-span-8 card bg-cream-50 border border-cream-300 rounded-3xl p-7 md:p-10 flex flex-col">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-500"></span>
                <span className="pill"><span className="dot" />Limited founding spots</span>
              </div>
              {/* Tabs */}
              <div role="tablist" aria-label="Choose your level of access" className="inline-flex p-1 bg-cream-100 border border-cream-200 rounded-full">
                <button
                  role="tab"
                  aria-selected={tab === 'beta'}
                  onClick={() => {setTab('beta');setSubmitted(null);setErrors({});}}
                  className={`px-4 py-1.5 rounded-full text-[12px] font-medium tracking-tight transition-colors ${tab === 'beta' ? 'bg-ink-900 text-cream-50' : 'text-ink-700 hover:text-ink-900'}`}>
                  
                  Beta access
                </button>
                <button
                  role="tab"
                  aria-selected={tab === 'waitlist'}
                  onClick={() => {setTab('waitlist');setSubmitted(null);setErrors({});}}
                  className={`px-4 py-1.5 rounded-full text-[12px] font-medium tracking-tight transition-colors ${tab === 'waitlist' ? 'bg-ink-900 text-cream-50' : 'text-ink-700 hover:text-ink-900'}`}>
                  
                  Waitlist
                </button>
              </div>
            </div>

            <div className="mt-7 grid md:grid-cols-12 gap-6 md:gap-10 items-start">
              <div className="md:col-span-5">
                {tab === 'beta' ?
                <>
                    <h3 className="font-serif text-[30px] md:text-[36px] leading-[1.05] tracking-[-0.015em] text-ink-900">
                      Be a founding member.
                    </h3>
                    <p className="mt-4 text-ink-600 text-[15.5px] leading-relaxed">
                      Build with us. Free during beta, weekly check-ins with the team, and a forever discount when we launch. We&rsquo;re looking for fifty owners across as many trades as we can find.
                    </p>
                    <ul className="mt-6 space-y-2.5 text-[14px] text-ink-700">
                      <Bullet>Hands-on onboarding with a real human</Bullet>
                      <Bullet>Help shape what gets built next</Bullet>
                      <Bullet>Founding-member pricing, kept for life</Bullet>
                    </ul>
                  </> :

                <>
                    <h3 className="font-serif text-[30px] md:text-[36px] leading-[1.05] tracking-[-0.015em] text-ink-900">
                      Hear from us when it&rsquo;s ready.
                    </h3>
                    <p className="mt-4 text-ink-600 text-[15.5px] leading-relaxed">
                      Lower commitment. We&rsquo;ll send one email when public access opens, and the occasional honest note about what we&rsquo;re building. No promo blasts.
                    </p>
                    <ul className="mt-6 space-y-2.5 text-[14px] text-ink-700">
                      <Bullet>One email at launch</Bullet>
                      <Bullet>Early-access window before everyone else</Bullet>
                      <Bullet>Unsubscribe in one click, always</Bullet>
                    </ul>
                  </>
                }
              </div>

              <div className="md:col-span-7">
                {submitted === tab ?
                <SuccessNote which={tab} onReset={() => setSubmitted(null)} /> :
                tab === 'beta' ?
                <form onSubmit={submit('beta')} noValidate className="space-y-1">
                    <Field
                    label="Your name"
                    hint="01"
                    error={errors.name}
                    input={
                    <input
                      className="input focus-ring"
                      placeholder="June Alvarez"
                      value={betaForm.name}
                      onChange={(e) => setBetaForm({ ...betaForm, name: e.target.value })}
                      aria-invalid={!!errors.name} />

                    } />
                  
                    <Field
                    label="Email"
                    hint="02"
                    error={errors.email}
                    input={
                    <input
                      type="email"
                      className="input focus-ring"
                      placeholder="june@junebakes.com"
                      value={betaForm.email}
                      onChange={(e) => setBetaForm({ ...betaForm, email: e.target.value })}
                      aria-invalid={!!errors.email} />

                    } />
                  
                    <Field
                    label="What you sell or do"
                    hint="03"
                    error={errors.sells}
                    input={
                    <textarea
                      className="input focus-ring"
                      rows={2}
                      placeholder="Sourdough loaves and seasonal pastries, pickup Saturdays in Eagle Rock."
                      value={betaForm.sells}
                      onChange={(e) => setBetaForm({ ...betaForm, sells: e.target.value })}
                      aria-invalid={!!errors.sells} />

                    } />
                  
                    <div className="pt-5 flex items-center justify-between flex-wrap gap-3">
                      <p className="text-[12px] text-ink-500 max-w-[36ch]">
                        We read every application. Expect a real reply within a few days.
                      </p>
                      <button type="submit" className="btn-primary focus-ring px-6 py-3.5 rounded-full text-[14px] font-medium">
                        Request beta access &nbsp;→
                      </button>
                    </div>
                  </form> :

                <form onSubmit={submit('waitlist')} noValidate className="space-y-1">
                    <Field
                    label="Email"
                    hint="01"
                    error={errors.email}
                    input={
                    <input
                      type="email"
                      className="input focus-ring"
                      placeholder="you@yourbusiness.com"
                      value={waitForm.email}
                      onChange={(e) => setWaitForm({ email: e.target.value })}
                      aria-invalid={!!errors.email} />

                    } />
                  
                    <div className="pt-5 flex items-center justify-between flex-wrap gap-3">
                      <p className="text-[12px] text-ink-500 max-w-[36ch]">
                        We send maybe one email a month. Mostly we&rsquo;re heads-down building.
                      </p>
                      <button type="submit" className="btn-primary focus-ring px-6 py-3.5 rounded-full text-[14px] font-medium">
                        Join the waitlist &nbsp;→
                      </button>
                    </div>
                  </form>
                }
              </div>
            </div>
          </article>

          {/* Community path */}
          <aside className="lg:col-span-4 card bg-espresso-900 paper-dark text-cream-50 rounded-3xl p-7 md:p-9 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream-50/60"> COMMUNITY</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-honey-400">Open now</span>
            </div>
            <h3 className="mt-7 font-serif font-light text-[30px] md:text-[36px] leading-[1.05] tracking-[-0.015em]">
              Start <em className="italic text-honey-300">before</em> the product is out.
            </h3>
            <p className="mt-4 text-cream-50/75 text-[15px] leading-relaxed">
              Our Skool community is open to anyone thinking about taking their small business online. Workshops on pricing, photos, story, and the awkward business stuff nobody teaches.
            </p>

            <ul className="mt-6 space-y-2.5 text-[14px] text-cream-50/85">
              <BulletDark>Live weekly workshop</BulletDark>
              <BulletDark>Real owners, real questions</BulletDark>
              <BulletDark>Free to join, no pitch</BulletDark>
            </ul>

            <a
              href="https://www.skool.com/"
              target="_blank" rel="noreferrer"
              className="mt-auto pt-8 inline-flex items-center justify-between gap-4 group focus-ring rounded">
              
              <span className="font-serif text-[18px] tracking-tight border-b border-honey-400/50 pb-0.5 group-hover:border-honey-400">Visit the community on Skool</span>
              <span className="w-9 h-9 rounded-full bg-honey-400 text-ink-900 flex items-center justify-center transition-transform group-hover:translate-x-1">→</span>
            </a>
          </aside>
        </div>
      </div>
    </section>);

}

function Field({ label, error, input }) {
  return (
    <label className="block pt-4">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-600">{label}</span>
      </div>
      {input}
      {error ? <div className="mt-1 text-[12px] text-honey-700">{error}</div> : null}
    </label>);

}

function Bullet({ children }) {
  return (
    <li className="flex items-start gap-2.5">
      <svg width="14" height="14" viewBox="0 0 14 14" className="mt-1 shrink-0" aria-hidden="true">
        <path d="M2 7l3.5 3.5L12 4" fill="none" stroke="#d99634" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{children}</span>
    </li>);

}

function BulletDark({ children }) {
  return (
    <li className="flex items-start gap-2.5">
      <svg width="14" height="14" viewBox="0 0 14 14" className="mt-1 shrink-0" aria-hidden="true">
        <path d="M2 7l3.5 3.5L12 4" fill="none" stroke="#f3c97a" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{children}</span>
    </li>);

}

function SuccessNote({ which, onReset }) {
  return (
    <div className="rise rounded-2xl border border-honey-400/40 bg-honey-300/20 p-7">
      <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-honey-700">
        <span className="w-2 h-2 rounded-full bg-honey-500 inline-block" />
        {which === 'beta' ? 'Application received' : 'You\u2019re on the list'}
      </div>
      <h4 className="mt-3 font-serif text-[26px] leading-[1.1] text-ink-900 tracking-[-0.01em]">
        {which === 'beta' ? 'Thank you — we\u2019ll be in touch.' : 'See you at launch.'}
      </h4>
      <p className="mt-3 text-[15px] text-ink-700 leading-relaxed">
        {which === 'beta' ?
        'A founder will read your note within a few days and reply personally. In the meantime, our community is the best place to start.' :
        'You\u2019ll hear from us when the door opens. No promo blasts in between.'}
      </p>
      <button onClick={onReset} className="mt-5 text-[12px] font-mono uppercase tracking-[0.14em] text-ink-600 hover:text-ink-900 link-underline">
        Submit another
      </button>
    </div>);

}

/* ──────────────────────────────────────────────────────────
   Ownership pledge — quiet, but the biggest point
   ────────────────────────────────────────────────────────── */
function Pledge() {
  return (
    <section className="relative">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 py-20 md:py-28">
        <div className="grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-2">
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-honey-700">/ our pledge</div>
          </div>
          <blockquote className="md:col-span-10 font-serif font-light text-[30px] md:text-[44px] leading-[1.15] tracking-[-0.015em] text-ink-900">
            <span className="text-honey-500">“</span>You own your business, your customers, your money. <em className="italic text-honey-700">We never take a cut of your sales.</em><span className="text-honey-500">”</span>
          </blockquote>
        </div>
        <div className="honey-rule mt-12" />
      </div>
    </section>);

}

/* ──────────────────────────────────────────────────────────
   Footer
   ────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="relative bg-espresso-900 paper-dark text-cream-50">
      <div className="max-w-[1180px] mx-auto px-6 md:px-10 pt-16 pb-10">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <BohdiLogo tone="cream" size={32} />
            <p className="mt-5 font-serif font-light text-[26px] md:text-[30px] leading-[1.15] tracking-[-0.01em] max-w-[18ch]">
              The trusted friend who happens to be really good at tech.
            </p>
            <p className="mt-5 text-cream-50/60 text-[14px] max-w-[40ch]">
              Built for small businesses. Made in California. Launching summer 2026.
            </p>
          </div>
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 text-[14px]">
            <FooterCol title="Get involved">
              <FLink href="#access">Request beta</FLink>
              <FLink href="#access">Join the waitlist</FLink>
              <FLink href="#community">Skool community</FLink>
            </FooterCol>
            <FooterCol title="The thing">
              <FLink href="#how">How it works</FLink>
              <FLink href="#access">Who it&rsquo;s for</FLink>
              <FLink href="#login">Log in (soon)</FLink>
            </FooterCol>
            <FooterCol title="Get in touch">
              <FLink href="mailto:hello@bohdi.ai">hello@bohdi.ai</FLink>
              <FLink href="#">Press &amp; partners</FLink>
              <FLink href="#">Privacy</FLink>
            </FooterCol>
          </div>
        </div>
        <div className="mt-16 pt-6 border-t border-cream-50/10 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-cream-50/50">
          <span>© 2026 BohdiAI · bohdi.ai</span>
          <span>You own it. All of it.</span>
        </div>
      </div>
    </footer>);

}

function FooterCol({ title, children }) {
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-honey-300 mb-4">{title}</div>
      <ul className="space-y-2.5">{children}</ul>
    </div>);

}

function FLink({ href, children }) {
  return (
    <li>
      <a href={href} className="text-cream-50/85 hover:text-cream-50 link-underline">{children}</a>
    </li>);

}

/* ──────────────────────────────────────────────────────────
   App
   ────────────────────────────────────────────────────────── */
function App() {
  const tabRef = useRef(null);
  const jumpToForm = (which) => tabRef.current && tabRef.current(which);

  return (
    <main>
      <Header />
      <Hero onJumpToForm={jumpToForm} />
      <HowItWorks />
      <Breadth />
      <Paths tabRef={tabRef} />
      <Pledge />
      <Footer />
    </main>);

}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);