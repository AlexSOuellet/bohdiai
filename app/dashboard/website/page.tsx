import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getCurrentShop } from '@/lib/dashboard/current-shop';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';
import { loadCurrentLook } from '@/lib/dashboard/load-look';
import { isFeatureEnabled } from '@/lib/feature-flags';
import Editor from './_components/Editor';

export const metadata = { title: 'My Website — BohdiAI' };

export default async function MyWebsitePage() {
  const shop = await getCurrentShop();
  if (shop === null) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center text-text-soft">
        You don’t have a store yet. Build one first, then come back to reshape it.
      </div>
    );
  }

  // The editor is gated until it's ready for makers (off in prod like onboarding,
  // always on in dev). Per-tenant allowlist lets us open it to beta testers.
  if (!(await isFeatureEnabled('editor', shop.tenantId))) notFound();

  const look = await loadCurrentLook(shop.tenantId);
  if (look === null) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center text-text-soft">
        This store isn’t on the new look engine yet, so the feeling editor can’t open for it.
      </div>
    );
  }

  const origin = storefrontOrigin(shop.subdomain, (await headers()).get('host'));

  return (
    <Editor
      currentSkin={look.lookKey}
      currentFeeling={look.moodKey}
      previewOrigin={origin}
    />
  );
}
