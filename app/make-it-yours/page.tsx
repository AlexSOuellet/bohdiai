import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getCurrentShop } from '@/lib/dashboard/current-shop';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { readDraftTree } from '@/lib/editor/draft';
import { mintPreviewToken } from '@/lib/editor/preview-token';
import { loadHomeEnvelope } from '@/lib/storefront/load-envelope';
import { EDITABLE_FIELDS, getFieldValue } from '@/lib/editor/editable-fields';
import { walkComplete, walkUiSteps, sectionResolved } from '@/lib/editor/walkthrough';
import { sectionState } from '@/lib/editor/section-state';
import { resolveMomentPlayMode } from '@/lib/archetypes/main-street/moment-gate';
import { getFamily } from '@/lib/archetypes/main-street/families';
import { supabaseAdmin } from '@/lib/supabase';
import { loadWalkProducts } from '@/lib/listings/product-queries';
import { loadWalkCollections } from '@/lib/listings/collection-queries';
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

  // Resolve the maker's feeling from the envelope, so the walk shows a Moment step
  // (and names the feeling) only when their hero actually plays a Moment (D54).
  const root = homeEnv['root'];
  const rootRec = root !== null && typeof root === 'object' ? (root as Record<string, unknown>) : undefined;
  const mood = typeof rootRec?.['mood'] === 'string' ? (rootRec['mood'] as string) : null;
  const content = rootRec?.['content'];
  const moment = content !== null && typeof content === 'object' ? (content as Record<string, unknown>)['moment'] : undefined;
  const momentPlayMode = resolveMomentPlayMode(moment as { playMode?: unknown; playIntro?: unknown } | undefined);

  const steps = walkUiSteps(mood);
  const family = getFamily(mood);
  const moodLabel = family.publicMoodLabel;

  // Hero step needs the current moment.media (non-Cheerful preview) and
  // moment.collageShots (Cheerful preview) to render its photo controls.
  const momentRec = moment !== null && typeof moment === 'object' && !Array.isArray(moment) ? (moment as Record<string, unknown>) : undefined;
  const mediaRec = momentRec?.['media'];
  const heroMedia =
    mediaRec !== null && typeof mediaRec === 'object' && !Array.isArray(mediaRec)
      ? (() => {
          const m = mediaRec as Record<string, unknown>;
          const kind = m['kind'];
          const url = m['url'];
          if (typeof url !== 'string' || url.length === 0) return undefined;
          if (kind !== 'still' && kind !== 'video') return undefined;
          const alt = typeof m['alt'] === 'string' ? (m['alt'] as string) : '';
          return { kind: kind as 'still' | 'video', url, alt };
        })()
      : undefined;
  const shotsRaw = momentRec?.['collageShots'];
  const heroShots = Array.isArray(shotsRaw)
    ? shotsRaw
        .map((s) => {
          if (s === null || typeof s !== 'object' || Array.isArray(s)) return null;
          const rec = s as Record<string, unknown>;
          const url = rec['url'];
          if (typeof url !== 'string' || url.length === 0) return null;
          const alt = typeof rec['alt'] === 'string' ? (rec['alt'] as string) : '';
          return { url, alt };
        })
        .filter((s): s is { url: string; alt: string } => s !== null)
        .slice(0, 3)
    : undefined;
  // Only the star-RATING reviews layout shows an overall number, so only that feeling's
  // reviews step offers the optional real-rating fields. Seed them from the current
  // summary (if the maker has already entered one).
  const reviewsShowsRating = family.sectionDefaults.reviews === 'rating';
  const reviewsRec = content !== null && typeof content === 'object' ? (content as Record<string, unknown>)['reviews'] : undefined;
  const summaryRec = reviewsRec !== null && typeof reviewsRec === 'object' ? (reviewsRec as Record<string, unknown>)['summary'] : undefined;
  const reviewsSummary =
    summaryRec !== null && typeof summaryRec === 'object'
      ? {
          score: typeof (summaryRec as Record<string, unknown>)['score'] === 'string' ? ((summaryRec as Record<string, unknown>)['score'] as string) : undefined,
          count: typeof (summaryRec as Record<string, unknown>)['count'] === 'string' ? ((summaryRec as Record<string, unknown>)['count'] as string) : undefined,
        }
      : undefined;

  // Per-step resolution from the draft, so the walk starts at the top with each finished
  // section already marked completed (and in its right state) instead of untouched.
  const resolvedFlags = steps.map((s) => sectionResolved(homeEnv, s.section));
  const resolutions = steps.map((s) => sectionState(homeEnv, s.section));

  // The maker's real products + collections so far, for the goods and collections steps.
  const products = await loadWalkProducts(supabaseAdmin(), shop.tenantId);
  const collections = await loadWalkCollections(supabaseAdmin(), shop.tenantId);

  const previewToken = mintPreviewToken(shop.tenantId);
  const origin = storefrontOrigin(shop.subdomain, (await headers()).get('host'));

  return (
    <MakeItYours
      previewToken={previewToken}
      previewOrigin={origin}
      values={values}
      steps={steps}
      momentPlayMode={momentPlayMode}
      moodLabel={moodLabel}
      reviewsShowsRating={reviewsShowsRating}
      reviewsSummary={reviewsSummary}
      resolvedFlags={resolvedFlags}
      resolutions={resolutions}
      products={products}
      collections={collections}
      family={family.key}
      heroMedia={heroMedia}
      heroShots={heroShots}
    />
  );
}
