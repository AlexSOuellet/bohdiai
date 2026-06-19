import type { Metadata } from 'next';
import { Suspense } from 'react';
import SignInForm from './SignInForm';

export const metadata: Metadata = {
  title: 'Sign in — BohdiAI',
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="flex h-14 items-center border-b border-white/5 px-6">
        <span className="font-serif text-xl text-honey">BohdiAI</span>
      </header>
      <main id="main" className="mx-auto max-w-md px-6 py-16">
        <Suspense>
          <SignInForm />
        </Suspense>
      </main>
    </div>
  );
}
