import type { ReactNode } from 'react';
import Link from 'next/link';
import { getCurrentShop } from '@/lib/dashboard/current-shop';
import { signOutMaker } from '@/lib/auth/actions';
import DashboardNav from './_components/DashboardNav';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // getCurrentShop calls requireUser → logged-out makers are redirected to /signin.
  const shop = await getCurrentShop();

  return (
    <div className="flex min-h-screen bg-bg text-text">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-white/8 bg-bg-2/60 px-4 py-6 md:flex">
        <Link href="/dashboard" className="px-3 font-serif text-xl tracking-tight text-text">
          Bohdi<span className="text-honey">AI</span>
        </Link>

        <div className="mt-8 flex-1">
          <DashboardNav />
        </div>

        <form action={signOutMaker} className="px-1">
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-white/5 hover:text-text-soft"
          >
            Sign out
          </button>
        </form>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-white/8 px-6 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text">
              {shop?.businessName ?? 'No store yet'}
            </p>
            {shop && (
              <p className="truncate text-xs text-muted">{shop.subdomain}.bohdiai.com</p>
            )}
          </div>
        </header>

        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
