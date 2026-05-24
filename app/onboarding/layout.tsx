import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Get Started — BohdiAI',
  robots: { index: false, follow: false },
};

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="flex h-14 items-center border-b border-white/5 px-6">
        <span className="font-serif text-xl text-honey">BohdiAI</span>
      </header>
      <main id="main" className="mx-auto max-w-xl px-6 py-12">
        {children}
      </main>
    </div>
  );
}
