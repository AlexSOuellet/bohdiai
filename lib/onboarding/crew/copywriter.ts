/**
 * The Copywriter. Writes every word of the store to ONE brief — the Director's
 * trajectory — using the niche body for vocabulary and context (D40).
 *
 * No bias: the prompt hands over the role, the trajectory (the materials-derived
 * direction), the full niche file, and a STRUCTURAL spec of every field — its
 * name, where it appears, its hard limits, and which treatment bodies exist. It
 * never says how to write (no "sell emotionally", no "avoid jargon", no "short
 * sentences"); the trajectory is the only direction, and it came from the maker's
 * own materials, not from us.
 *
 * Forced single tool use with a short validation-retry loop (more fields = more
 * chance of a miss) and a hard per-call timeout.
 */
import type Anthropic from '@anthropic-ai/sdk';
import { anthropicClient } from '@/lib/anthropic';
import { logger } from '@/lib/logger';
import { withTimeout } from '@/lib/with-timeout';
import { GOODS_TREATMENT_MENU, type GoodsTreatment } from '@/lib/archetypes/main-street/goods';
import type { FounderTreatment } from '@/lib/archetypes/main-street/founder';
import { LINK_TARGETS } from '@/lib/archetypes/main-street/links';
import { CopywriterDraftSchema, type CopywriterDraft } from './copywriter-schema';
import { buildResubmitPayload } from './length-feedback';
import { normalizeCopy } from './normalize-copy';
import type { Trajectory } from './trajectory';
import type { CrewBrief } from './types';

/** The starting hand the pipeline deals: a treatment for each of the two beats
 *  that converge. The copywriter plays each unless it genuinely fights the shop. */
export interface TreatmentRolls {
  goods: GoodsTreatment;
  founder: FounderTreatment;
}

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 12000;
const MAX_ATTEMPTS = 4;
// 90s is the per-call backstop. The soft length guidance in the prompt is
// what actually keeps generation quick. The sum of all stage timeouts must
// stay under the route's 300s ceiling (see pipeline.ts PIPELINE_DEADLINE_MS +
// the guard test); 90s is the audit's recommended trim of the prior 180s.
export const TIMEOUT_MS = 90_000;

const SUBMIT_COPY_TOOL: Anthropic.Tool = {
  name: 'submit_copy',
  description: 'Submit every word of the store. Returns { ok: true } or { ok: false, issues: [...] } to fix and resubmit.',
  input_schema: { type: 'object', properties: {}, additionalProperties: true },
};

const TARGET_PRODUCTS = 5;

export function buildCopywriterPrompt(brief: CrewBrief, trajectory: Trajectory, rolls: TreatmentRolls): string {
  const niche = brief.nicheBody.trim();
  const target = TARGET_PRODUCTS;
  const goods = (Object.entries(GOODS_TREATMENT_MENU) as Array<[string, string]>)
    .map(([k, d]) => `      - ${k}: ${d}`)
    .join('\n');
  const targets = LINK_TARGETS.join(', ');

  const makerNameTrimmed = brief.makerName?.trim();
  const nameLockClause = makerNameTrimmed
    ? `THE MAKER'S NAME — the maker's real first name is "${makerNameTrimmed}". Lock founder.attribution to "${makerNameTrimmed}" exactly. Do not invent, shorten, or add a surname.`
    : `THE MAKER'S NAME — the maker's first name was not captured. Write a generic attribution like "The maker" for founder.attribution rather than inventing a name.`;

  const storyDirective =
    '- moment.story (1-4 lines, each 4-48 chars, aim for 36-44 to leave headroom — the cap is a hard cap, lines that land at 48 burn the build): the maker\'s short narrative of the hero shot, authored content stored alongside the brand. Keep them tight and true to the trajectory. HARD: each line carries NO punctuation — no periods, commas, dashes, colons, or quotes (apostrophes and intra-word hyphens are fine).';

  return `You are the COPYWRITER on Bohdi's crew. You write every word of this maker's storefront, to ONE brief: the trajectory the Director set. Serve it.

THE TRAJECTORY
- feeling: ${trajectory.feeling}
- why the customer wants this: ${trajectory.customerWhy}
- visual world: ${trajectory.visualWorld}
- the hero moment: ${trajectory.heroConcept}
- type register: ${trajectory.register}

THE NICHE — context and vocabulary for this kind of maker and who buys from them. Read all of it:
${niche}

${nameLockClause}

LINKS — every link you write carries a label AND a target page, so what a button
says and where it goes always agree. A target is one of: ${targets}.
- home: the front page. shop: the full products page (the catalog — the home is a
  SAMPLING, the shop is where every piece lives, so "see the work" / "shop now" /
  "browse the collection" all target shop). about: the maker's story page.
  events: where to find the maker in person. contact: get in touch / ask for a
  custom order.
Choose the target that matches what the label promises — a button that says "Our
story" targets about, "Shop now" or "See the work" targets shop, "Find us"
targets events. (Targets must come from that list; these are the only pages that
exist.)

Write the words with submit_copy. Each field, its hard limits (stay under), and where it appears.

HEADINGS ARE PHRASES, NOT SENTENCES. The headings and headlines below (goods.title, founder.heading, close.headline, about.heading, contact.heading) carry NO periods, exclamation marks, or question marks, and never end in trailing punctuation. "One potter. One wheel. One kiln at a time." is the slop pattern to avoid — write one clean line ("Wheel-thrown stoneware, made to last"). Internal commas are fine. (Body prose — about.story, contact.intro, descriptions — is normal sentences.)

KEEP IT TIGHT. The body-prose fields have NO hard length cap — the build never rejects them for length — but write punchy, not padded: aim for a 1-3 sentence founder quote, 2-4 sentence product descriptions, a few tight sentences per About paragraph, and a short Contact intro. A storefront reads better lean than long.

- shopName: the shop is named "${brief.shopName}". This is the maker's own name for their shop — use it EXACTLY, do not invent, shorten, or alter it.
- identity.wordmark: "${brief.shopName}" as it shows in the nav — use the exact name.
- identity.nav (2-4 items): the nav links, each { label (2-18), target }.
${storyDirective}
- moment.eyebrow (4-48): a small line above the hero.
- moment.brand: "${brief.shopName}" — the brand the story lands on; use the exact name.
- moment.sub: one plain supporting sentence under the headline — what this shop is or makes, in a single clear line (e.g. "Hand-poured soy candles in small batches"). This is NOT the fading story lines; it is the standing sub-headline the other hero styles show. A normal short sentence; internal commas fine, no trailing period needed.
- moment.ctaLabel (3-24): the hero button. moment.ctaTarget: where it goes.
- moment.secondaryCtaLabel (3-24, optional): a second hero button. moment.secondaryCtaTarget: where it goes (include when you write the secondary label).
- goods.title (2-48): the heading of the products beat.
- goods.treatment: you drew "${rolls.goods}" this build — the dice, not us, so shops stop wearing the same body. Keep your draw unless it genuinely fights this shop; if it does, pick another from these and note why in one line:
${goods}
- goods.label (2-24, optional): a small label on the heading row.
- goods.viewAllLabel (2-28, optional): the cue to the full Products page.
- marquee.voice (2-6 phrases): the phrases a bold scrolling marquee band shows — short brand lines in THIS shop's voice, a few words each (e.g. "Small batch", "Poured by hand", "Rhode Island made"). No sentences, no trailing punctuation. Write only the voice; the band pairs these with live info (find-us dates, collection names) the store already holds, so do not write logistics here.
- reviews: the testimonials beat — seed it like the find-us dates, plausible placeholder social proof the maker edits or replaces, NOT labeled "sample". Do NOT pick a layout; just write the words:
      - reviews.title (2-40): the heading of the beat (e.g. "Kind words", "What they say").
      - reviews.label (2-24, optional): a small eyebrow over the heading (e.g. "Loved by customers").
      - reviews.summary (optional): an honest aggregate for the star-rating layout — { score (e.g. "4.9 out of 5"), count (e.g. "200+ happy customers" — keep it modest and believable for a small maker, or omit if it would overreach) }.
      - reviews.items (3-6): each { quote (a warm, specific line a real customer would write — about the FEELING the work gave them, never how it is made), author (a first name + last initial, e.g. "Dana R."), location (optional, e.g. "Providence, RI") }. Vary the voices; no two should read alike. No AI-tell.
- founder.quote (24+, no hard cap): the founder's words in the About beat
- founder.attribution (4-60): who said it.
- founder.treatment: you drew "${rolls.founder}" this build — the dice again. Keep your draw unless it genuinely fights this shop; if it does, pick another from these and note why in one line:
      - quote: a portrait beside a pull-quote.
      - portrait: a large portrait with the quote over it.
      - letter: your words as a short note on a paper slip, a snapshot clipped to it, signed by hand.
      - card: a meet-the-maker card — REQUIRES founder.eyebrow and founder.heading.
      - workbench: a wide documentary shot of you at work + a short intro (your quote is the caption); set founder.eyebrow as the small label (e.g. "In the workshop").
      - editorial: a magazine feature — it lays your full about.story in columns with a drop cap and your quote as the pull-quote, so write a rich about.story and an about.heading for this one.
      - signature: your promise set large as type, no photo — your quote IS the statement, so make it a punchy one-line creed.
- founder.eyebrow (2-24, optional): the small label above the card heading (also the workbench / editorial kicker).
- founder.heading (2-28, optional): the card heading (also a fallback editorial headline).
- founder.aboutLabel (2-28, optional): the cue to the full About page.
- founder.findUs (optional): a "find us this week" calendar. Dates are unknown at build time, so seed 1-5 plausible sample rows the maker edits or turns off later: { label (2-28), eventsLabel (2-28, optional), rows (1-5): { day (1-12), where (4-60), time (1-12) } }.
- close.label (2-28): the close kicker.
- close.headline (6-72): the big close line.
- close.ctaLabel (3-24): the close button. close.ctaTarget: where it goes.
- about.heading (4-60): the About page heading.
- about.story (2-5 paragraphs, each 40+, no hard cap): the About page body.
- contact.heading (4-48): the Contact page heading.
- contact.intro (20+, no hard cap): the Contact page invitation. Real email and phone are unknown at build time and the maker adds them later, so write the voice, not contact details.
- products (write ${target}): each { name (2-40), slug (2-48, lowercase-hyphen), shortDescription (4-90), description (12+, no hard cap), basePriceCents (integer cents, e.g. 4800 = $48) }.

Call submit_copy now.`;
}

/** Run the Copywriter: trajectory + niche in, one validated words-only draft out. */
export async function writeCopy(brief: CrewBrief, trajectory: Trajectory, rolls: TreatmentRolls): Promise<CopywriterDraft> {
  const system = buildCopywriterPrompt(brief, trajectory, rolls);
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: 'Write every word of the store. Call submit_copy.' },
  ];
  let lastIssues = '';

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const resp = await withTimeout(
      anthropicClient().messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system,
        tools: [SUBMIT_COPY_TOOL],
        tool_choice: { type: 'tool', name: 'submit_copy' },
        messages,
      }),
      TIMEOUT_MS,
      'copywriter',
    );

    const tu = resp.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    if (!tu) throw new Error('Copywriter did not call submit_copy');

    const parsed = CopywriterDraftSchema.safeParse(tu.input);
    if (parsed.success) {
      // Normalize the draft — strip headline / story punctuation, slugify slugs,
      // trim whitespace. ACCEPTING transforms, never throw — the build never
      // fails on copy formatting (D53 sharpened).
      const normalized = normalizeCopy(parsed.data);
      logger.info('crew: copy written', { products: normalized.products.length, goods: normalized.goods.treatment, founder: normalized.founder.treatment });
      return normalized;
    }

    const payload = buildResubmitPayload(parsed.error, tu.input);
    payload.issues = payload.issues.slice(0, 14);
    lastIssues = payload.issues.map((i) => `${i.path}: ${i.message}`).join('; ');
    messages.push({ role: 'assistant', content: resp.content });
    messages.push({
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: tu.id, is_error: true, content: JSON.stringify(payload) }],
    });
  }

  throw new Error(`Copywriter did not produce valid copy within ${MAX_ATTEMPTS} attempts. Last issues: ${lastIssues}`);
}
