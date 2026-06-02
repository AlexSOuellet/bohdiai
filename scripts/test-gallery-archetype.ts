#!/usr/bin/env tsx
/**
 * One-off test harness — runs Bohdi against the Gallery archetype schema for a
 * fixed brief, captures his content + theme pick, validates against the schema,
 * and writes the result to a JSON fixture the render route consumes.
 *
 * Usage: npx tsx scripts/test-gallery-archetype.ts
 *
 * The brief here is fixed (jewelry / ELEGANT / "Quill & Stone") on purpose —
 * a visual, image-forward maker that is NOT the ceramics shop the archetype was
 * sketched against, to test that the Gallery carries any niche. Change the
 * brief to re-test on a different niche/mood.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { GalleryContentSchema, GALLERY_THEMES } from '../lib/archetypes/gallery';

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
  shopName: 'Quill & Stone',
  niche: 'jewelry',
  nicheDescription:
    'A small-batch jeweler making fine rings, earrings, and pendants by hand. Recycled gold and silver, ethically sourced stones, a lot of one-of-a-kind pieces. Sells online and at a few curated craft and design markets a year.',
  mood: 'ELEGANT',
  moodDescription:
    'Quiet, refined, lots of breathing room. Clean and intentional, like a jewelry case under a single warm light. Restraint over decoration. NOT loud or maximal.',
};

const THEME_KEYS = Object.keys(GALLERY_THEMES);

// ---------- system prompt ----------
const SYSTEM_PROMPT = `You are Bohdi, the editor-in-chief of a maker's storefront that renders as a Gallery — a dense, browsable wall of the maker's work as the centerpiece, opened by an identity band and supported by featured collections, the maker's own story and face, in-person appearances, and a footer.

You do not design. The Gallery's layout, fonts, color pairs, spacing, the unifying photo grade, and motion are all fixed by the archetype. Your job is content authoring + one theme pick.

THE MAKER

- Shop name: ${BRIEF.shopName}
- Niche: ${BRIEF.niche}. ${BRIEF.nicheDescription}
- Mood: ${BRIEF.mood}. ${BRIEF.moodDescription}

THE FORM

You submit your work by calling the submit_gallery tool ONCE with two arguments: a "content" object that fills the Gallery's content schema in full, and a "themeKey" string picking one of the theme variants. If your content fails validation, you will get back the specific errors and must call submit_gallery again with fixes.

THE CONTENT SCHEMA (fields you must produce). Note the MAX lengths — they are real; the layout breaks if you exceed them. Do NOT try to hit a limit exactly. You are not good at counting characters, so stay comfortably under every maximum and leave margin. Keep headlines and names tight.

- shopName (string 2-40) — the exact shop name from the brief.
- identity (object):
    - wordmark (2-28) — the shop name as it reads in the big wordmark at the top (usually the shop name itself).
    - tagline (8-96) — one line of the maker's voice under the wordmark. Specific, not a platitude.
    - nav (array of 2-4 strings, each 2-18) — top navigation labels (e.g. "Shop", "Collections", "About").
- wall (object):
    - products (array of 8-24): each { name (2-48), price (1-14, as written e.g. "$148" or "from $40"), photo: { prompt (8-400) vivid image prompt, alt (4-120) }, tag (2-18, OPTIONAL small marker like "1 of 1" or "New") }. This is the wall — the heart of the page. Give it real range: different pieces, different prices.
- collections (object, OPTIONAL — omit if it doesn't fit): { title (2-36) a short section eyebrow naming the grouping like "Shop by collection" or "Browse by type", items (array of 2-4): each { name (2-40), photo: { prompt, alt } } }.
- maker (object) — REQUIRED, the story and face:
    - label (2-24) small eyebrow like "The Studio" or "About"
    - headline (6-52) the story hook, about 5 to 7 words. Tight — this renders large, so keep it short.
    - body (40-480) the story paragraph, in the maker's voice. About 3 short sentences. Keep it well under the limit; do not pad to fill it. Specifics, no AI-tell phrases.
    - photo: { prompt, alt } — a portrait or studio shot.
    - ctaLabel (3-28) e.g. "Read the full story"
- markets (object, OPTIONAL — omit if the maker does no in-person events):
    - title (4-40) e.g. "Find me in person"
    - events (array of 1-5): each { dateLabel (2-24) short date, name (2-60) where }
- footer (object):
    - blurb (8-90) one short line, e.g. where it's made and shipped
    - columns (array of EXACTLY 2): each { title (2-24), items (array of 2-5 strings, each 1-28) } — e.g. a links column and a connect column.

THE THEME KEYS (pick one for themeKey)

${Object.values(GALLERY_THEMES)
  .map((t) => {
    const desc = (
      {
        'gallery-bone': 'warm bone/cream background, ink text, terracotta accent — warm and clean, the default',
        'gallery-slate': 'cool light slate-gray background, deep slate text, muted teal accent — quiet and contemporary',
        'gallery-ink': 'near-black background, warm off-white text, brass accent — dark, luxe, dramatic',
        'gallery-linen': 'soft linen/greige background, warm brown text, sage-green accent — organic and natural',
      } as Record<string, string>
    )[t.key];
    return `- ${t.key}: ${desc ?? t.label}`;
  })
  .join('\n')}

Pick the theme that fits this maker's niche and mood best.

VOICE GUIDANCE

Specifics over platitudes. No AI-tell phrases ("crafted with care", "every piece tells a story", "discover the difference", etc.). Each sentence should give the reader something concrete. Write like a real maker who knows their craft.

Punctuation: avoid em-dashes and semicolons in body copy; use short sentences. No terminal punctuation in headlines or the wordmark.

Begin. Author the full content, pick a theme, and submit.`;

// ---------- tool ----------
const SUBMIT_TOOL: Anthropic.Tool = {
  name: 'submit_gallery',
  description:
    'Submit the complete Gallery content and the theme pick. Returns either { ok: true } on a valid submission or { ok: false, issues: [...] } with structured validation errors if any field is missing, mis-typed, or out of bounds (including exceeding a max length).',
  input_schema: {
    type: 'object',
    properties: {
      content: {
        type: 'object',
        description: 'The full Gallery content object satisfying the schema described in the system prompt.',
      },
      themeKey: {
        type: 'string',
        enum: THEME_KEYS,
        description: 'One of the theme keys.',
      },
    },
    required: ['content', 'themeKey'],
  },
};

// ---------- run ----------
const MAX_TURNS = 8;
const fixturePath = path.join(repoRoot, 'app', 'archetype-test', 'gallery-fixture.json');

async function main(): Promise<void> {
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: 'Author this maker\'s Gallery now. Call submit_gallery when ready.' },
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

    const args = toolUse.input as { content?: unknown; themeKey?: unknown };
    const parsed = GalleryContentSchema.safeParse(args.content);

    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({
        path: i.path.join('.'),
        code: i.code,
        message: i.message,
      }));
      process.stdout.write(`Validation failed (${issues.length} issues):\n`);
      for (const i of issues.slice(0, 12)) {
        process.stdout.write(`  - ${i.path}: ${i.message}\n`);
      }
      messages.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify({ ok: false, issues }),
            is_error: true,
          },
        ],
      });
      continue;
    }

    if (typeof args.themeKey !== 'string' || !THEME_KEYS.includes(args.themeKey)) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify({
              ok: false,
              issues: [{ path: 'themeKey', message: `Must be one of: ${THEME_KEYS.join(', ')}` }],
            }),
            is_error: true,
          },
        ],
      });
      continue;
    }

    const fixture = { content: parsed.data, themeKey: args.themeKey };
    fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
    fs.writeFileSync(fixturePath, JSON.stringify(fixture, null, 2));
    process.stdout.write(`\n✓ Valid submission. Theme: ${args.themeKey}.\n`);
    process.stdout.write(`  Products on the wall: ${parsed.data.wall.products.length}\n`);
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
