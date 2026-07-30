/**
 * Bohdi the writer — the stateless content-editing agent.
 *
 * Given a set of editable fields, their current values, the maker's instruction,
 * and the shop's niche voice, it rewrites ONLY those fields in the shop's own voice
 * and returns the new values. It writes nothing to the database and holds no memory
 * between calls (D23/D27) — the walkthrough (now) and free-form chat (later) drive it.
 *
 * It reuses the crew copywriter's shape: a forced single tool whose input schema is
 * exactly the fields in play, a short validation-retry loop, a hard per-call timeout,
 * and the same accepting normalize transforms (never fail on copy — D53/D57).
 *
 * The honesty rule (D68) is carried in the prompt: Bohdi shapes what the maker gave
 * him and never invents facts — no made-up history, names, prices, or testimonials.
 * A field he'd have to fabricate to fill is left unchanged (omitted from the result).
 */
import type Anthropic from '@anthropic-ai/sdk';
import { anthropicClient } from '@/lib/anthropic';
import { logger } from '@/lib/logger';
import { withTimeout } from '@/lib/with-timeout';
import { stripHeadlinePunct, stripStoryPunct } from '@/lib/onboarding/crew/normalize-copy';
import type { EditableField, NormalizeStyle } from './editable-fields';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 4000;
const MAX_ATTEMPTS = 4;
export const TIMEOUT_MS = 60_000;

/** Thrown when Bohdi can't return a usable rewrite within the attempt budget. The
 *  caller surfaces a friendly message and leaves the draft untouched. */
export class ContentEditError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContentEditError';
  }
}

export interface NicheVoice {
  readonly displayName: string;
  readonly body: string;
}

export interface RunContentEditArgs {
  /** The fields Bohdi may rewrite this call. */
  readonly fields: readonly EditableField[];
  /** id → current value, so Bohdi sees what's there now. */
  readonly current: Record<string, unknown>;
  /** What the maker asked, in their own words (or a direction). */
  readonly instruction: string;
  /** The shop's niche voice — grounds the rewrite so it sounds like this shop. */
  readonly niche: NicheVoice;
}

export interface RunContentEditResult {
  /** id → new value, normalized, only for fields Bohdi actually rewrote. */
  readonly values: Record<string, unknown>;
}

function normalizeString(s: string, style: NormalizeStyle): string {
  if (style === 'headline') return stripHeadlinePunct(s);
  if (style === 'story') return stripStoryPunct(s);
  return s.trim();
}

/** Coerce + normalize a raw model value to the field's kind. Returns `undefined`
 *  when the type doesn't match or the result normalizes to empty (so the caller
 *  simply skips the field rather than staging junk). */
function normalizeFieldValue(field: EditableField, raw: unknown): unknown | undefined {
  if (field.kind === 'text') {
    if (typeof raw !== 'string') return undefined;
    const v = normalizeString(raw, field.normalize);
    return v.length > 0 ? v : undefined;
  }
  if (field.kind === 'lines') {
    if (!Array.isArray(raw)) return undefined;
    const lines = raw
      .filter((x): x is string => typeof x === 'string')
      .map((x) => normalizeString(x, field.normalize))
      .filter((x) => x.length > 0);
    return lines.length > 0 ? lines : undefined;
  }
  // items — the whole array is the value; deeper per-item editing is a later phase.
  return Array.isArray(raw) ? raw : undefined;
}

function buildTool(fields: readonly EditableField[]): Anthropic.Tool {
  const properties: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.kind === 'lines') properties[f.id] = { type: 'array', items: { type: 'string' }, description: f.label };
    else if (f.kind === 'items') properties[f.id] = { type: 'array', items: { type: 'object' }, description: f.label };
    else properties[f.id] = { type: 'string', description: f.label };
  }
  return {
    name: 'write_fields',
    description: "Return the rewritten fields as { fieldId: newValue }. Omit any field you'd have to invent facts to fill.",
    // required is intentionally empty: Bohdi may omit a field he can't honestly
    // rewrite from what the maker gave him (D68).
    input_schema: { type: 'object', properties, required: [] } as Anthropic.Tool['input_schema'],
  };
}

function describeKind(kind: EditableField['kind']): string {
  if (kind === 'lines') return 'a list of lines';
  if (kind === 'items') return 'a list';
  return 'one line';
}

export function buildContentEditPrompt(args: RunContentEditArgs): string {
  const fieldList = args.fields
    .map(
      (f) =>
        `- ${f.id} (${describeKind(f.kind)}) — ${f.label}. Current: ${JSON.stringify(args.current[f.id] ?? null)}`,
    )
    .join('\n');

  return `You are Bohdi, the writer for a ${args.niche.displayName}'s storefront. You rewrite ONLY the specific text fields named below, in the shop's own voice, guided by what the maker told you. You never touch the store's structure, layout, look, nav, links, or images — only the words listed.

THE SHOP — context and vocabulary for this kind of maker and who buys from them. Read it and write like this shop, not generic copy:
${args.niche.body}

WHAT THE MAKER ASKED:
${args.instruction}

HOW TO WRITE — rewrite each field below in the shop's voice, using what the maker asked. Two rules that never bend:
- You shape what the maker gave you; you never INVENT facts. Do not make up the maker's history, their name, prices, dates, or customer testimonials. If a field would need a fact you weren't given, leave that field OUT of your answer rather than fabricate it.
- If the maker's ask is really about the LOOK (colours, layout, "make it cozier"), it's not yours to change — leave every field unchanged and return an empty answer.

Headings and labels are phrases, not sentences — no trailing punctuation. Body prose stays normal sentences. Keep it tight; a storefront reads better lean than long.

THE FIELDS YOU MAY REWRITE:
${fieldList}

Call write_fields with only the fields you actually rewrote.`;
}

/** Run Bohdi over the given fields. Returns the normalized new values (a subset of
 *  the requested fields). Throws ContentEditError if no valid tool call comes back
 *  within the attempt budget. Never writes to the database. */
export async function runContentEdit(args: RunContentEditArgs): Promise<RunContentEditResult> {
  const system = buildContentEditPrompt(args);
  const tool = buildTool(args.fields);
  const requested = new Set(args.fields.map((f) => f.id));
  const byId = new Map(args.fields.map((f) => [f.id, f] as const));

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: 'Rewrite the fields. Call write_fields.' },
  ];

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const resp = await withTimeout(
      (signal) =>
        anthropicClient().messages.create(
          {
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system,
            tools: [tool],
            tool_choice: { type: 'tool', name: 'write_fields' },
            messages,
          },
          { signal },
        ),
      TIMEOUT_MS,
      'content-edit',
    );

    const tu = resp.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    if (tu && tu.input !== null && typeof tu.input === 'object' && !Array.isArray(tu.input)) {
      const input = tu.input as Record<string, unknown>;
      const values: Record<string, unknown> = {};
      for (const [id, raw] of Object.entries(input)) {
        if (!requested.has(id)) continue;
        const field = byId.get(id);
        if (!field) continue;
        const nv = normalizeFieldValue(field, raw);
        if (nv !== undefined) values[id] = nv;
      }
      logger.info('editor: content rewrite', { requested: args.fields.length, written: Object.keys(values).length });
      return { values };
    }

    // No usable tool call — nudge and retry.
    messages.push({ role: 'assistant', content: resp.content });
    messages.push({ role: 'user', content: 'That did not include a write_fields tool call. Call write_fields with the rewritten fields.' });
  }

  throw new ContentEditError(`Bohdi did not return a usable rewrite within ${MAX_ATTEMPTS} attempts.`);
}
