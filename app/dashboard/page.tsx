import Link from 'next/link';
import { headers } from 'next/headers';
import { getCurrentShop } from '@/lib/dashboard/current-shop';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';

export const metadata = { title: 'Dashboard — BohdiAI' };

export default async function DashboardHome() {
  const shop = await getCurrentShop();

  if (shop === null) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="font-serif text-3xl text-text">Welcome to BohdiAI</h1>
        <p className="mt-3 text-text-soft">
          You don’t have a store yet. Let’s build one — it takes a few minutes.
        </p>
        <Link
          href="/onboarding"
          className="mt-8 inline-block rounded-lg bg-honey px-6 py-3 font-medium text-bg transition-opacity hover:opacity-90"
        >
          Build my store
        </Link>
      </div>
    );
  }

  const siteUrl = storefrontOrigin(shop.subdomain, (await headers()).get('host'));

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-serif text-3xl text-text">Welcome back</h1>
      <p className="mt-2 text-text-soft">
        Your store is live. Here’s where to go next.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/website"
          className="group rounded-xl border border-white/10 bg-bg-2/50 p-5 transition-colors hover:border-honey/40"
        >
          <p className="font-medium text-text group-hover:text-honey-warm">Change how it feels</p>
          <p className="mt-1 text-sm text-muted">
            Try your store in a different feeling — same content, a new look. Reversible anytime.
          </p>
        </Link>

        <a
          href={siteUrl}
          target="_blank"
          rel="noreferrer"
          className="group rounded-xl border border-white/10 bg-bg-2/50 p-5 transition-colors hover:border-honey/40"
        >
          <p className="font-medium text-text group-hover:text-honey-warm">View your live site ↗</p>
          <p className="mt-1 text-sm text-muted">See exactly what your customers see.</p>
        </a>
      </div>

      <div className="mt-8 rounded-xl border border-white/8 bg-bg-2/30 p-5">
        <p className="text-sm font-medium text-text-soft">Coming soon</p>
        <p className="mt-1 text-sm text-muted">
          Your own colors, adding real products, orders, and settings are on the way. Right now you
          can reshape the look of your store under <span className="text-text-soft">My Website</span>.
        </p>
      </div>
    </div>
  );
}
