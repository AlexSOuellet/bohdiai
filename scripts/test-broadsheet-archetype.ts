#!/usr/bin/env tsx
/**
 * One-off test harness — runs Bohdi against the broadsheet archetype schema
 * for a fixed brief, captures his content + theme pick, validates against the
 * schema, and writes the result to a JSON fixture the render route consumes.
 *
 * Usage: npx tsx scripts/test-broadsheet-archetype.ts
 *
 * The brief here is fixed (vintage / SIMPLE / "Mid Mod and More") on purpose —
 * the point of the run is to test that the broadsheet archetype can carry a
 * non-print, non-bakery maker. Change the brief if you want to re-test on a
 * different niche/mood.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { BroadsheetContentSchema, BROADSHEET_THEMES } from '../lib/archetypes/broadsheet';

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
  shopName: 'Mid Mod and More',
  niche: 'vintage',
  nicheDescription:
    'A small vintage shop specializing in mid-century modern furniture and objects. The owner sources from estate sales, flea markets, and word-of-mouth. New finds get listed regularly. The shop sells online and shows up at the occasional mid-century-focused antique show.',
  mood: 'SIMPLE',
  moodDescription:
    'Minimal-quiet. Clean restraint, plenty of breathing room, no decorative noise. The visual world is calm and intentional, like a curated room. NOT minimal-LOUD (that is MODERN). SIMPLE is the quiet kind.',
};

const THEME_KEYS = Object.keys(BROADSHEET_THEMES);

// ---------- system prompt ----------
const SYSTEM_PROMPT = `You are Bohdi, the editor-in-chief of a one-shop newspaper called the Broadsheet. Your job is to author every word of this maker's storefront, which renders as a 19th-century-style village broadsheet — masthead, lead story, weekly schedule, news column, classifieds, appearances list, founder's letter, colophon.

You do not design. The broadsheet's layout, fonts, color pairs, spacing, and motion are all fixed by the archetype. Your job is content authoring + one theme pick.

THE MAKER

- Shop name: ${BRIEF.shopName}
- Niche: ${BRIEF.niche}. ${BRIEF.nicheDescription}
- Mood: ${BRIEF.mood}. ${BRIEF.moodDescription}

THE FORM

You submit your work by calling the submit_broadsheet tool ONCE with two arguments: a "content" object that fills the broadsheet's content schema in full, and a "themeKey" string picking one of the four theme variants. If your content fails validation, you will get back the specific errors and must call submit_broadsheet again with fixes.

THE CONTENT SCHEMA (fields you must produce)

- shopName (string ≥2 chars) — exact shop name from the brief.
- mastheadTitle (string ≥4 chars) — the newspaper-style name you invent from the shop name. Examples (not for this maker, just shape): "The Salt Hill Herald", "The Hartland Weekly". You write the one that fits this shop.
- motto (string ≥8 chars) — italic line under the masthead. The shop's tagline.
- edition (object):
    - volumeLabel (≥3): "Vol. III — No. 24" style
    - issueLabel (≥3): same idea, can be the same or a sub-label
    - city (≥2), region (≥2): the place
    - dateLine (≥6): "Saturday · April 20 · 2026" style
    - priceLine (≥2): "Five cents" or similar mock-period detail
- nav (object):
    - sections (array of exactly 4 strings ≥2 chars each): top nav labels
    - primaryCta (string ≥2): action label
    - secondaryCta (string ≥2): action label
- lead (object) — the front-page lead story:
    - kicker (≥3): small uppercase line above the headline
    - headline (≥8): the main headline
    - headlineEmphasis (≥2, OPTIONAL): a single italicized word inside the headline if you want one
    - subhead (≥20): italic deck/dek under the headline
    - photo (object): { prompt (≥8): vivid visual prompt for the lead image, alt (≥4), caption (≥4) — figure caption in newspaper voice }
    - bodyDropCap (≥40): the opening paragraph (will render with a giant drop cap)
    - bodyContinuation (≥40): the second/follow-on paragraph
    - priceWord (≥4): the headline price spelled out ("Nine dollars even" / "Forty-eight")
    - priceFigure (≥2): the price in figures ("$9" / "$48")
    - ctaLabel (≥4): action label for the lead (e.g. "Reserve", "Inquire", "Buy now")
- schedule (object) — the week's cadence, whatever this maker offers day by day:
    - title (≥4): ornament-row title in the voice of this shop ("The Bakers' Almanac" for a bakery; you invent one for vintage)
    - intro (≥8): one-line italic intro
    - headers (object): { day, item, notes, price, status } — each ≥2-3 chars. These are the table column labels. Name the "item" column for THIS niche ("The bake" for bakery; you pick for vintage).
    - rows (array, 3 to 8): each { day, itemName, notes, price, status, highlight?: boolean }
- newsColumn (object) — three short notes/news items:
    - pageLabel (≥3): "Page two" or similar
    - sectionTitle (≥4): the H3 ("Around the oven" for bakery; you invent for vintage)
    - stories (array of EXACTLY 3): each { kicker (≥3), headline (≥4), body (≥20) }
- classifieds (object):
    - title (≥4): ornament-row title (e.g. "Classifieds — available this week")
    - items (array, 4 to 8): each { headline (≥2), body (≥20), price (≥2), tag (≥3) }
- appearances (object) — where the maker shows up in person:
    - pageLabel (≥3), sectionTitle (≥4), intro (≥8)
    - events (array, 1 to 6): each { dayDate (≥6, long form), location (≥4), time (≥3) }
- founderNote (object) — signed letter from the maker:
    - title (≥4): ornament-row title ("From the baker" → you invent for vintage)
    - paragraphs (array, 1 to 4): each ≥40 chars
    - signatureName (≥2): maker's name
    - signatureRole (≥4): role + place ("baker · proprietor · Hartland")
- colophon (object) — small print at the foot:
    - description (≥20)
    - contactColumnTitle (≥4): label for the contact column ("Correspond")
    - contact (object): { email (≥4), phone (≥4), address (≥4) }
    - subscribe (object): { title (≥4), blurb (≥8), ctaLabel (≥4) }
    - printedLine (≥4)

THE FOUR THEME KEYS (pick one for themeKey)

${Object.values(BROADSHEET_THEMES)
  .map((t) => {
    const desc = ({
      'aged-newsprint': 'warm cream, dark coal text, rust-red accent — the default village-newspaper feel',
      'kraft-paper': 'deeper warm brown paper, very dark brown text, deeper rust accent — like writing on a paper bag',
      'evening-print': 'dark coal background with cream text and amber accent — reading the paper by lamplight',
      'cyan-ledger': 'off-white cream with dark blue-black ink and teal accent — more formal, accountant\'s ledger feel',
    } as Record<string, string>)[t.key];
    return `- ${t.key}: ${desc ?? t.label}`;
  })
  .join('\n')}

Pick the theme that fits this maker's niche and mood best.

VOICE GUIDANCE

The broadsheet's voice is editorial — short declarative sentences, specifics over platitudes, no AI-tell phrases ("crafted with care", "every piece tells a story", "discover the difference", etc.). Each sentence should give a reader new information. Write like a small-town newspaper editor who knows the shop owner personally.

Punctuation: avoid em-dashes and semicolons in body copy; use short sentences instead. Avoid terminal punctuation in headlines.

Begin. Author the full content, pick a theme, and submit.`;

// ---------- tool ----------
const SUBMIT_TOOL: Anthropic.Tool = {
  name: 'submit_broadsheet',
  description:
    'Submit the complete broadsheet content and the theme pick. Returns either { ok: true } on a valid submission or { ok: false, issues: [...] } with structured validation errors if any field is missing, mis-typed, or out of bounds.',
  input_schema: {
    type: 'object',
    properties: {
      content: {
        type: 'object',
        description: 'The full broadsheet content object satisfying the schema described in the system prompt.',
      },
      themeKey: {
        type: 'string',
        enum: THEME_KEYS,
        description: 'One of the four theme keys.',
      },
    },
    required: ['content', 'themeKey'],
  },
};

// ---------- run ----------
const MAX_TURNS = 8;
const fixturePath = path.join(repoRoot, 'app', 'archetype-test', 'broadsheet-fixture.json');

async function main(): Promise<void> {
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: 'Author this maker\'s broadsheet now. Call submit_broadsheet when ready.' },
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

    // log any text content
    for (const block of resp.content) {
      if (block.type === 'text') process.stdout.write(block.text + '\n');
    }

    const toolUse = resp.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    if (!toolUse) {
      if (resp.stop_reason === 'end_turn') {
        process.stdout.write('\nBohdi ended without submitting. Stopping.\n');
        return;
      }
      // No tool call but not end_turn — push assistant message and continue.
      messages.push({ role: 'assistant', content: resp.content });
      continue;
    }

    messages.push({ role: 'assistant', content: resp.content });

    const args = toolUse.input as { content?: unknown; themeKey?: unknown };
    const parsed = BroadsheetContentSchema.safeParse(args.content);

    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({
        path: i.path.join('.'),
        code: i.code,
        message: i.message,
      }));
      process.stdout.write(`Validation failed (${issues.length} issues):\n`);
      for (const i of issues.slice(0, 10)) {
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

    // Validate theme key
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

    // Success — write fixture and stop
    const fixture = { content: parsed.data, themeKey: args.themeKey };
    fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
    fs.writeFileSync(fixturePath, JSON.stringify(fixture, null, 2));
    process.stdout.write(`\n✓ Valid submission. Theme: ${args.themeKey}.\n`);
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
