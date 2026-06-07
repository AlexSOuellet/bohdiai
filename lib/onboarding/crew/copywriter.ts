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
import { GOODS_TREATMENT_MENU } from '@/lib/archetypes/main-street/goods';
import { CopywriterDraftSchema, type CopywriterDraft } from './copywriter-schema';
import type { Trajectory } from './trajectory';
import type { CrewBrief } from './types';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 12000;
const MAX_ATTEMPTS = 4;
const TIMEOUT_MS = 90_000;

const SUBMIT_COPY_TOOL: Anthropic.Tool = {
  name: 'submit_copy',
  description: 'Submit every word of the store. Returns { ok: true } or { ok: false, issues: [...] } to fix and resubmit.',
  input_schema: { type: 'object', properties: {}, additionalProperties: true },
};

function targetProductCount(productCount: number): number {
  return Math.max(3, Math.min(productCount > 0 ? productCount : 6, 10));
}

function buildCopywriterPrompt(brief: CrewBrief, trajectory: Trajectory): string {
  const niche = brief.nicheBody.trim();
  const target = targetProductCount(brief.productCount);
  const goods = (Object.entries(GOODS_TREATMENT_MENU) as Array<[string, string]>)
    .map(([k, d]) => `      - ${k}: ${d}`)
    .join('\n');

  return `You are the COPYWRITER on Bohdi's crew. You write every word of this maker's storefront, to ONE brief: the trajectory the Director set. Serve it.

THE TRAJECTORY
- feeling: ${trajectory.feeling}
- why the customer wants this: ${trajectory.customerWhy}
- visual world: ${trajectory.visualWorld}
- the hero moment: ${trajectory.momentConcept}
- type register: ${trajectory.register}

THE NICHE — context and vocabulary for this kind of maker and who buys from them. Read all of it:
${niche}

Write the words with submit_copy. Each field, its hard limits (stay under), and where it appears:

- shopName (2-40): the shop's name.
- identity.wordmark (2-28): the name as it shows in the nav.
- identity.nav (2-4 items, each 2-18): the nav links.
- moment.story (2-4 lines, each 4-48): the hero lines, shown one at a time, each cross-fading into the next, landing on the brand. HARD: a line carries NO punctuation — no periods, commas, dashes, colons, or quotes (apostrophes and intra-word hyphens are fine). The marks would smear as the lines cross-fade.
- moment.eyebrow (4-48): a small line above the hero.
- moment.brand (2-28): the brand line the story lands on.
- moment.ctaLabel (3-24): the hero button.
- moment.secondaryCtaLabel (3-24, optional): a second hero button.
- goods.title (2-48): the heading of the products beat.
- goods.treatment: which body the products beat wears — pick the one that fits this shop:
${goods}
- goods.label (2-24, optional): a small label on the heading row.
- goods.viewAllLabel (2-28, optional): the cue to the full Products page.
- founder.quote (24-280): the founder's words in the About beat.
- founder.attribution (4-60): who said it.
- founder.treatment: which About-beat body — pick one:
      - quote: a portrait beside a pull-quote.
      - portrait: a large portrait with the quote over it.
      - letter: the quote as a short signed note with a small portrait.
      - card: a meet-the-maker card — REQUIRES founder.eyebrow and founder.heading.
- founder.eyebrow (2-24, optional): the small label above the card heading (card treatment).
- founder.heading (2-28, optional): the card heading (card treatment).
- founder.aboutLabel (2-28, optional): the cue to the full About page.
- founder.findUs (optional): a "find us this week" calendar. Dates are unknown at build time, so seed 1-5 plausible sample rows the maker edits or turns off later: { label (2-28), eventsLabel (2-28, optional), rows (1-5): { day (1-12), where (4-60), time (1-12) } }.
- close.label (2-28): the close kicker.
- close.headline (6-72): the big close line.
- close.ctaLabel (3-24): the close button.
- about.heading (4-60): the About page heading.
- about.story (2-5 paragraphs, each 40-700): the About page body.
- contact.heading (4-48): the Contact page heading.
- contact.intro (20-400): the Contact page invitation. Real email and phone are unknown at build time and the maker adds them later, so write the voice, not contact details.
- products (write ${target}): each { name (2-40), slug (2-48, lowercase-hyphen), shortDescription (4-90), description (12-600), basePriceCents (integer cents, e.g. 4800 = $48) }.

Call submit_copy now.`;
}

/** Run the Copywriter: trajectory + niche in, one validated words-only draft out. */
export async function writeCopy(brief: CrewBrief, trajectory: Trajectory): Promise<CopywriterDraft> {
  const system = buildCopywriterPrompt(brief, trajectory);
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
      logger.info('crew: copy written', { products: parsed.data.products.length, goods: parsed.data.goods.treatment, founder: parsed.data.founder.treatment });
      return parsed.data;
    }

    const issues = parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    lastIssues = issues.map((i) => `${i.path}: ${i.message}`).join('; ');
    messages.push({ role: 'assistant', content: resp.content });
    messages.push({
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: tu.id, is_error: true, content: JSON.stringify({ ok: false, issues: issues.slice(0, 14) }) }],
    });
  }

  throw new Error(`Copywriter did not produce valid copy within ${MAX_ATTEMPTS} attempts. Last issues: ${lastIssues}`);
}
