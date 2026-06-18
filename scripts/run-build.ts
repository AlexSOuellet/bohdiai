/** One-off: run a real storefront build from the CLI (the "Other / describe
 *  your craft" path). Proof/demo harness — creates a live tenant on the
 *  configured Supabase and generates images via fal.
 *
 *  Usage:
 *    npx tsx --env-file=.env.local scripts/run-build.ts "<Shop Name>" "<Maker Name>" <moodKey>
 *
 *  moodKey is one of: dark rustic cozy modern elegant cheerful industrial
 *
 *  The niche description is set inline below for this specific demo build.
 */
import { buildArchetypeStore } from '../lib/onboarding/build-archetype-store';
import { toSubdomain } from '../lib/subdomain';
import type { MoodKey } from '../lib/moods';

// The business being demoed: a live body-marbling art experience. Framed as a
// shop where each "product" is a body-area package (the maker's call).
const DESCRIPTION = `Body marbling — a live body-art experience. A guest dips a hand, forearm, leg, or back into a tub of swirling water-based paints and lifts it out wearing a one-of-a-kind marbled print on their skin, like a temporary tattoo that lasts a few days. Vibrant, neon, blacklight-reactive color. Booked for festivals, parties, corporate events, and private sessions. Sell it as packages by the area dipped: a hand-and-forearm print, a full-arm sleeve, a leg piece, a back piece, and a group party package for events. The work is the wow — bold, glowing, photographed against dark light.`;

async function main() {
  const [shopName, makerName, moodArg] = process.argv.slice(2);
  if (!shopName || !makerName || !moodArg) {
    console.error('usage: run-build.ts "<Shop Name>" "<Maker Name>" <moodKey>');
    console.error('moodKey: dark rustic cozy modern elegant cheerful industrial');
    process.exit(1);
  }
  const moodKey = moodArg as MoodKey;
  const subdomain = toSubdomain(shopName);

  console.log(`Building "${shopName}" (${subdomain}) — maker ${makerName}, mood ${moodKey}…`);
  const result = await buildArchetypeStore(
    {
      shopName,
      subdomain,
      nicheSlug: 'other',
      nicheDescription: DESCRIPTION,
      moodKey,
      productCount: 5,
      makerName,
    },
    (e) => {
      if (e.type === 'status') console.log(`  … ${e.label}`);
    },
  );
  console.log('DONE:', JSON.stringify(result, null, 2));
  console.log(`\nLive at: https://${result.subdomain}.bohdiai.com  (or ${result.subdomain}.localhost:3000 in dev)`);
}

main().catch((e) => {
  console.error('FAILED:', e);
  process.exit(1);
});
