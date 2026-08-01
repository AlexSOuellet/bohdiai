import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getCurrentShop } from '@/lib/dashboard/current-shop';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { readDraftTree } from '@/lib/editor/draft';
import { mintPreviewToken } from '@/lib/editor/preview-token';
import { loadHomeEnvelope } from '@/lib/storefront/load-envelope';
import { EDITABLE_FIELDS, getFieldValue } from '@/lib/editor/editable-fields';
import { walkComplete } from '@/lib/editor/walkthrough';
import MakeItYours from '@/app/dashboard/website/_components/MakeItYours';

export const metadata = { title: 'Make it yours — BohdiAI' };

/** The full-screen "Make It Yours" walk (D69) — the second half of onboarding, on
 *  its own route outside the dashboard so it carries no chrome. The editor redirects
 *  here until the walk is complete (gate wired in a later task). */
export default async function MakeItYoursPage() {
  const shop = await getCurrentShop();
  if (shop === null) notFound();

  // Gated behind the same flag as the editor while the walk is built out.
  if (!(await isFeatureEnabled('editor', shop.tenantId))) notFound();

  // Read the current words from the draft (so a returning maker resumes) or live.
  const draftTree = await readDraftTree(shop.tenantId);
  const homeEnv = draftTree ?? { root: (await loadHomeEnvelope(shop.tenantId)) ?? {} };

  // Once the walk is complete the editor door is open — the walk is one-time (D69),
  // so a finished maker who lands here is sent on to their editor.
  if (walkComplete(homeEnv)) redirect('/dashboard/website');

  const values: Record<string, unknown> = {};
  for (const f of EDITABLE_FIELDS) values[f.id] = getFieldValue(homeEnv, f.id);

  // The hero's first-run intro on/off setting (default on when absent — D54).
  const root = homeEnv['root'];
  const content = root !== null && typeof root === 'object' ? (root as Record<string, unknown>)['content'] : undefined;
  const moment = content !== null && typeof content === 'object' ? (content as Record<string, unknown>)['moment'] : undefined;
  const heroIntroOn =
    moment !== null && typeof moment === 'object' ? (moment as Record<string, unknown>)['playIntro'] !== false : true;

  const previewToken = mintPreviewToken(shop.tenantId);
  const origin = storefrontOrigin(shop.subdomain, (await headers()).get('host'));

  return <MakeItYours previewToken={previewToken} previewOrigin={origin} values={values} heroIntroOn={heroIntroOn} />;
}
