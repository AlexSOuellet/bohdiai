#!/usr/bin/env tsx
/**
 * Reproduction test — runs Bohdi against the Main Street archetype schema for a
 * non-bakery brief, captures his content + skin pick, validates against the
 * schema, and writes a fixture the render route consumes.
 *
 * Usage: npx tsx scripts/test-main-street-archetype.ts
 *
 * The brief is a LEATHERWORKER on purpose — the spec's own example of the
 * niche-neutrality test, and about as far from the bakery the archetype was
 * sketched against as a maker shop gets (no food, no warm-oven imagery to lean
 * on). If Bohdi can fill the four beats in a leatherworker's voice and it reads
 * as a leatherworker — not a recolored bakery — the shape+skin split holds.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { MainStreetContentSchema, MAIN_STREET_SKINS } from '../lib/archetypes/main-street';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

// ---------- env ----------
function loadEnv(): Record<string, string> {
  const raw = fs.readFileSync(path.join(repoRoot, '.env.local'), 'utf8');
  const env: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && m[1] && m[2] !== undefined) env[m[1]] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const apiKey = env['BOHDIAI_ANTHROPIC_KEY'];
if (!apiKey) throw new Error('BOHDIAI_ANTHROPIC_KEY not set in .env.local');

const client = new Anthropic({ apiKey });

// ---------- brief ----------
const BRIEF = {
  shopName: 'Tannery Row',
  niche: 'leather goods',
  nicheDescription:
    'A one-person leather workshop making belts, wallets, totes, and knife rolls by hand from full-grain veg-tanned hide. Saddle-stitched, edges burnished by hand, hardware solid brass. Sells online and at a couple of maker markets a month.',
  mood: 'RUGGED',
  moodDescription:
    'Honest, sturdy, workshop-worn. Tools on a bench, the smell of leather and beeswax. Nothing precious or fashion-y — built to be used for thirty years. Warm but not soft.',
};

const SKIN_KEYS = Object.keys(MAIN_STREET_SKINS);

// ---------- system prompt ----------
const SYSTEM_PROMPT = `You are Bohdi, the editor-in-chief of a maker's storefront that renders as MAIN STREET — a paced sales page in four full-width beats:

1. THE MOMENT (the hero): a full-screen held video with a short brand story told one line at a time, cross-fading, landing on the brand name and a button. This IS the hero.
2. GOODS IN MOTION: a slow marquee of the maker's products. You write only the section heading; the products themselves come from the catalog, not you.
3. THE FOUNDER + a "find us this week" calendar: the maker's voice and face, beside where to meet them in person.
4. THE CLOSE: a big-type sign-off and an order/pickup button.

You do NOT design. The layout, fonts, color, spacing, grain, and all motion are fixed by the archetype and the skin. Your job is content authoring + writing the hero video PROMPT + one skin pick.

THE MAKER

- Shop name: ${BRIEF.shopName}
- Niche: ${BRIEF.niche}. ${BRIEF.nicheDescription}
- Mood: ${BRIEF.mood}. ${BRIEF.moodDescription}

THE FORM

Submit by calling submit_main_street ONCE with a "content" object filling the schema below and a "skinKey" string. If content fails validation you get the specific errors back and call submit_main_street again with fixes.

THE CONTENT SCHEMA (fields you must produce). The MAX lengths are real — the layout breaks if you exceed them. Do NOT try to hit a limit exactly. You are not good at counting characters, so stay comfortably under every maximum and leave margin. Keep headlines, story lines, and the brand tight.

- shopName (2-40) — the exact shop name from the brief.
- identity (object):
    - wordmark (2-28) — the shop name as it reads in the nav (usually the shop name itself).
    - nav (array of 2-4 strings, each 2-18) — top nav labels, e.g. "Shop", "About", "Find us".
- moment (object) — the hero:
    - media (object): { kind: "video", prompt (8-400) a vivid prompt for a SLOW, held hero video that sets the mood (motion is gentle, atmospheric — steam, hands working, light moving; NOT a fast cut), alt (4-120) }.
    - story (array of 2-5 strings, each 4-48) — the brand story, one short line per entry, cross-fading in order. Build a small arc that lands on the brand. Tight, evocative, lower-case-feel is fine.
    - eyebrow (4-48) — a small line above the brand on the final frame, e.g. "Made by hand in [place]".
    - brand (2-28) — the brand name as the big hero wordmark (usually the shop name).
    - ctaLabel (3-24) — the primary button, e.g. "See the work".
    - secondaryCtaLabel (3-24, OPTIONAL) — a quieter second button, e.g. "Our story".
- goods (object):
    - title (2-48) — the heading over the product marquee, in the maker's voice.
    - label (2-24, OPTIONAL) — a small marker on the heading row, e.g. "New this month".
- founder (object) — REQUIRED, the authority of the shop:
    - quote (24-280) — the maker's voice, first person, about 2 sentences. Specific. No AI-tell phrases.
    - attribution (4-60) — who is speaking, e.g. "Sam Reyes, founder and maker".
    - photo: { prompt (8-400), alt (4-120) } — a portrait or at-the-bench shot.
    - findUs (object, OPTIONAL — omit if the maker does no in-person events): { label (2-28) e.g. "Find us this week", rows (array of 1-5): each { day (1-12) short, e.g. "Sat", where (4-60), time (1-12) e.g. "9-2" } }.
- close (object):
    - label (2-28) — a small eyebrow, e.g. "Come say hello".
    - headline (6-72) — the big sign-off line.
    - ctaLabel (3-24) — the final button, e.g. "Order yours".

THE SKIN KEYS (pick one for skinKey)

${SKIN_KEYS.map((k) => `- ${k}: ${MAIN_STREET_SKINS[k]?.label ?? k}`).join('\n')}

(There is one skin on the shelf so far; pick it.)

VOICE GUIDANCE

Specifics over platitudes. No AI-tell phrases ("crafted with care", "every piece tells a story", "discover the difference"). Each line gives the reader something concrete. Write like a real maker who knows their craft. The hero story lines are the hardest and the most important — make them land.

Punctuation: avoid em-dashes and semicolons in body copy; use short sentences. NO terminal punctuation in headlines, story lines, or the brand.

Begin. Author the full content, write the hero video prompt, pick the skin, and submit.`;

// ---------- tool ----------
const SUBMIT_TOOL: Anthropic.Tool = {
  name: 'submit_main_street',
  description:
    'Submit the complete Main Street content and the skin pick. Returns { ok: true } on a valid submission or { ok: false, issues: [...] } with structured validation errors if any field is missing, mis-typed, or out of bounds (including exceeding a max length).',
  input_schema: {
    type: 'object',
    properties: {
      content: {
        type: 'object',
        description: 'The full Main Street content object satisfying the schema described in the system prompt.',
      },
      skinKey: { type: 'string', enum: SKIN_KEYS, description: 'One of the skin keys.' },
    },
    required: ['content', 'skinKey'],
  },
};

// ---------- run ----------
const MAX_TURNS = 8;
const fixturePath = path.join(repoRoot, 'app', 'archetype-test', 'main-street-fixture.bohdi.json');

async function main(): Promise<void> {
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: "Author this maker's Main Street now. Call submit_main_street when ready." },
  ];

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    process.stdout.write(`\n--- turn ${turn + 1} ---\n`);
    const resp = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      tools: [SUBMIT_TOOL],
      messages,
    });

    for (const block of resp.content) {
      if (block.type === 'text') process.stdout.write(block.text + '\n');
    }

    const toolUse = resp.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    if (!toolUse) {
      if (resp.stop_reason === 'end_turn') {
        process.stdout.write('\nBohdi ended without submitting. Stopping.\n');
        return;
      }
      messages.push({ role: 'assistant', content: resp.content });
      continue;
    }

    messages.push({ role: 'assistant', content: resp.content });

    const args = toolUse.input as { content?: unknown; skinKey?: unknown };
    const parsed = MainStreetContentSchema.safeParse(args.content);

    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({ path: i.path.join('.'), code: i.code, message: i.message }));
      process.stdout.write(`Validation failed (${issues.length} issues):\n`);
      for (const i of issues.slice(0, 12)) process.stdout.write(`  - ${i.path}: ${i.message}\n`);
      messages.push({
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify({ ok: false, issues }), is_error: true }],
      });
      continue;
    }

    if (typeof args.skinKey !== 'string' || !SKIN_KEYS.includes(args.skinKey)) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify({ ok: false, issues: [{ path: 'skinKey', message: `Must be one of: ${SKIN_KEYS.join(', ')}` }] }),
            is_error: true,
          },
        ],
      });
      continue;
    }

    const fixture = { content: parsed.data, skinKey: args.skinKey };
    fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
    fs.writeFileSync(fixturePath, JSON.stringify(fixture, null, 2));
    process.stdout.write(`\n✓ Valid submission. Skin: ${args.skinKey}.\n`);
    process.stdout.write(`  Story lines: ${parsed.data.moment.story.length}\n`);
    process.stdout.write(`  Hero video prompt: ${parsed.data.moment.media.prompt}\n`);
    process.stdout.write(`  Written to ${path.relative(repoRoot, fixturePath)}\n`);
    return;
  }

  process.stdout.write(`\nMax turns (${MAX_TURNS}) reached without a valid submission.\n`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
