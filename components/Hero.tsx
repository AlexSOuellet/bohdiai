'use client';

import { useEffect, useState } from 'react';
import { StorefrontStack } from './StorefrontStack';

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
] as const;

export function Hero() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % BUSINESS_TYPES.length), 2200);
    return () => clearInterval(t);
  }, []);

  const current = BUSINESS_TYPES[idx] ?? BUSINESS_TYPES[0];

  return (
    <section id="top" className="relative">
      <div className="mx-auto max-w-[1180px] px-6 pb-16 pt-16 md:px-10 md:pb-24 md:pt-24">
        <div className="grid items-end gap-10 md:grid-cols-12 md:gap-12">
          <div className="animate-rise md:col-span-8">
            <div className="mb-7 flex items-center gap-3 md:mb-9">
              <span className="pill">
                <span className="dot" />
                Beta opening · Summer 2026
              </span>
              <span className="hidden font-mono text-[11px] uppercase tracking-[0.12em] text-ink-500 md:inline">
                bohdiai.com
              </span>
            </div>
            <h1 className="font-serif text-[44px] font-light leading-[0.95] tracking-[-0.025em] text-ink-900 sm:text-[64px] md:text-[88px]">
              Your business <br className="hidden sm:block" />
              online. <em className="font-serif font-light italic text-honey-600">Finally</em>
              <br className="hidden sm:block" /> made easy.
            </h1>
            <div className="mt-8 max-w-[640px] md:mt-10">
              <p className="text-[19px] font-light leading-[1.45] text-ink-700 md:text-[22px]">
                Tell BohdiAI you&rsquo;re{' '}
                <span className="relative inline-block min-w-[12ch] align-baseline">
                  <span
                    key={idx}
                    className="animate-fadeSwap font-medium text-ink-900"
                    aria-live="polite"
                  >
                    {current}
                  </span>
                </span>{' '}
                — and a professional storefront, built for the way <em>your</em> business actually
                works, goes live in minutes.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <a
                href="#waitlist"
                className="btn-primary focus-ring rounded-full px-7 py-4 text-[15px] font-medium tracking-[-0.005em]"
              >
                Get on the waitlist &nbsp;→
              </a>
              <a
                href="#how"
                className="focus-ring rounded-full border border-ink-900/20 px-7 py-4 text-[15px] font-medium text-ink-900 transition-colors hover:border-ink-900/60"
              >
                See how it works
              </a>
            </div>

            <ul className="mt-8 flex items-center gap-5 font-mono text-[13px] uppercase tracking-[0.1em] text-ink-500">
              <li className="flex items-center gap-2">
                <Check /> No code
              </li>
              <li className="flex items-center gap-2">
                <Check /> You keep 100%
              </li>
              <li className="hidden items-center gap-2 sm:flex">
                <Check /> Live in minutes
              </li>
            </ul>
          </div>

          <div className="animate-rise md:col-span-4" style={{ animationDelay: '0.15s' }}>
            <StorefrontStack />
          </div>
        </div>
      </div>
    </section>
  );
}

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M2 7l3.5 3.5L12 4"
        fill="none"
        stroke="#d99634"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
