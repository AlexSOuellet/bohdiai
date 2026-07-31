import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getCurrentShop } from '@/lib/dashboard/current-shop';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';
import { loadCurrentLook } from '@/lib/dashboard/load-look';
import { getFamily } from '@/lib/archetypes/main-street/families';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { readDraftTree } from '@/lib/editor/draft';
import { mintPreviewToken } from '@/lib/editor/preview-token';
import { readStoredTexture } from '@/lib/editor/texture';
import { loadHomeEnvelope } from '@/lib/storefront/load-envelope';
import { walkComplete } from '@/lib/editor/walkthrough';
import { MOODS, type MoodKey } from '@/lib/moods';
import Editor from './_components/Editor';

export const metadata = { title: 'My Website — BohdiAI' };

function asMoodKey(value: unknown, fallback: MoodKey): MoodKey {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(MOODS, value)
    ? (value as MoodKey)
    : fallback;
}

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

  // If the maker has an unpublished draft, open the editor on the STAGED look (so a
  // returning maker resumes their draft) rather than the live one. Absent → no draft.
  const draftTree = await readDraftTree(shop.tenantId);
  const draftRoot = draftTree?.['root'];
  const stagedLook =
    draftRoot !== null && typeof draftRoot === 'object' && !Array.isArray(draftRoot)
      ? {
          skin:
            typeof (draftRoot as Record<string, unknown>)['lookKey'] === 'string'
              ? ((draftRoot as Record<string, unknown>)['lookKey'] as string)
              : look.lookKey,
          feeling: asMoodKey((draftRoot as Record<string, unknown>)['mood'], look.moodKey),
          texture: readStoredTexture((draftRoot as Record<string, unknown>)['texture']) ?? undefined,
        }
      : null;

  // A short-lived token authorising the draft preview for this tenant. The preview
  // iframe rides it so the storefront renders the staged draft, not the public store.
  const previewToken = mintPreviewToken(shop.tenantId);

  // Door 2 texture is just the family's own wallpaper + an opacity dial now (the
  // per-niche shelf was removed — D63). Seed the dial from the live family's real
  // wallpaper strength so it doesn't jump on first drag.
  const defaultTextureOpacity = getFamily(look.moodKey).textureOpacity;

  const origin = storefrontOrigin(shop.subdomain, (await headers()).get('host'));

  // The editor is gated behind the "Make It Yours" walk (D69): until every section
  // is resolved, the maker is sent to the full-screen walk instead of the editor.
  const homeEnv = draftTree ?? { root: (await loadHomeEnvelope(shop.tenantId)) ?? {} };
  if (!walkComplete(homeEnv)) redirect('/make-it-yours');

  return (
    <Editor
      currentSkin={look.lookKey}
      currentFeeling={look.moodKey}
      stagedLook={stagedLook}
      previewToken={previewToken}
      previewOrigin={origin}
      defaultTextureOpacity={defaultTextureOpacity}
      savedTexture={look.texture}
    />
  );
}
