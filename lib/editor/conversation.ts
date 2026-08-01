/**
 * Bohdi the designer — the back-and-forth interview that drives the "Make It Yours"
 * walk (D69). Where `content-agent.ts` is a one-shot writer, this is the *conversation*
 * that happens before the writing: Bohdi reacts to what he built, asks the maker a
 * question, listens, and asks a natural follow-up — pulling their real story out —
 * until he has enough to write the section (then the writer takes over).
 *
 * One call = one Bohdi turn. Given the section, the shop's niche voice, what he built,
 * the depth (a story section vs a light one), and the conversation so far, he either
 * asks one more question (`ask`) or signals he has enough (`ready`). The maker can also
 * cut straight to writing at any time — that's the caller's choice, not his.
 *
 * Stateless (D23/D27): the conversation is passed in every call and held only in the
 * walk session; nothing here is persisted. The honesty rule (D68) is in the prompt —
 * Bohdi draws the maker's story OUT, he never invents it.
 */
import type Anthropic from '@anthropic-ai/sdk';
import { anthropicClient } from '@/lib/anthropic';
import { logger } from '@/lib/logger';
import { withTimeout } from '@/lib/with-timeout';
import type { SectionKey } from '@/lib/archetypes/main-street/families';
import type { NicheVoice } from './content-agent';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 1024;
const MAX_ATTEMPTS = 4;
export const TIMEOUT_MS = 60_000;

/** Thrown when Bohdi can't produce a usable turn within the attempt budget. The
 *  caller surfaces a friendly message and leaves the conversation as it was. */
export class ConversationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConversationError';
  }
}

export type Speaker = 'bohdi' | 'maker';

/** One line of the running conversation, in the order it was said. */
export interface Turn {
  readonly speaker: Speaker;
  readonly text: string;
}

/** Deep sections carry the maker's story (hero, founder) and get the real interview;
 *  light sections (marquee, close, contact, goods heading…) get a quick react-and-go. */
export type ConversationDepth = 'deep' | 'light';

/** Bohdi's next move: keep drawing them out, or he's got enough to write. `message`
 *  is what he actually says to the maker. */
export type BohdiTurn =
  | { readonly action: 'ask'; readonly message: string }
  | { readonly action: 'ready'; readonly message: string };

export interface ConverseArgs {
  /** The section being made theirs (drives the story-vs-light framing). */
  readonly section: SectionKey;
  /** The shop's niche voice — grounds Bohdi so he talks like this kind of maker. */
  readonly niche: NicheVoice;
  /** What Bohdi built for this section — the starting point they react to together. */
  readonly current: Record<string, unknown>;
  /** The conversation so far, oldest first. Empty on the opening turn. */
  readonly conversation: readonly Turn[];
  /** Story section or light one. */
  readonly depth: ConversationDepth;
}

/** A friendly name for the section so the prompt reads like a person, not a key. */
const SECTION_NAMES: Record<SectionKey, string> = {
  hero: 'opening (the first thing anyone sees)',
  goods: 'products heading',
  collections: 'collections',
  reviews: 'kind words from customers',
  marquee: 'scrolling line of short phrases',
  founder: 'story (who they are and how their shop began)',
  contact: 'get-in-touch invitation',
  close: 'sign-off at the bottom of the page',
  findUs: 'where-to-find-you dates',
};

const DEEP_BLOCK = `THIS SECTION CARRIES THEIR STORY. Draw out the real, specific stuff — how it started, what makes theirs different from anyone else's, who it's really for, what a regular would say about them. Ask for concrete detail, never a vague "tell me about yourself." Two or three good answers is usually enough; the moment you have real material to write something true, choose "ready" rather than dragging it out.`;

const LIGHT_BLOCK = `THIS IS A LIGHT SECTION — there's no life story to pull here. React to what you built and ask, once, what they'd change about it. The moment they give you a direction — or say it's fine as is — choose "ready".`;

export function buildConversationPrompt(args: ConverseArgs): string {
  const sectionName = SECTION_NAMES[args.section];
  const depthBlock = args.depth === 'deep' ? DEEP_BLOCK : LIGHT_BLOCK;
  return `You are Bohdi, a working designer sitting beside a ${args.niche.displayName} to make the ${sectionName} on their store truly theirs. Warm, direct, genuinely curious — like a good designer in the room, never a form and never an interrogation.

THE SHOP — how this kind of maker talks and who buys from them. Talk like you know this world:
${args.niche.body}

WHAT YOU BUILT for this section — the starting point you're looking at together:
${JSON.stringify(args.current)}

${depthBlock}

HOW YOU TALK:
- One thing at a time. Ask a single, specific question — the kind that pulls a real, concrete detail out.
- React to what they just said and build on it; don't restart or repeat.
- Never invent their story. You draw it out of them — you never make up their history, names, prices, or customers.
- Keep it short and human: a sentence of reaction, then your one question.

Call next_turn on every turn: "ask" with your question while you're still drawing them out; "ready" (with a warm line like "I think I've got it — want me to write it?") the moment you have enough real material to write something true.`;
}

const NEXT_TURN_TOOL: Anthropic.Tool = {
  name: 'next_turn',
  description:
    'Your next turn. action "ask" to ask the maker one more question; action "ready" once you have enough to write the section. message is what you say to the maker.',
  input_schema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['ask', 'ready'], description: 'ask for more, or ready to write' },
      message: { type: 'string', description: 'what you say to the maker' },
    },
    required: ['action', 'message'],
  } as Anthropic.Tool['input_schema'],
};

/** Map the running conversation into alternating API messages (maker → user,
 *  Bohdi → assistant), then ensure it ends on a user turn so the model answers as
 *  Bohdi next. An empty conversation gets a kickoff user turn to open the section. */
function buildMessages(conversation: readonly Turn[]): Anthropic.MessageParam[] {
  const messages: Anthropic.MessageParam[] = conversation.map((t) => ({
    role: t.speaker === 'maker' ? 'user' : 'assistant',
    content: t.text,
  }));
  const last = messages[messages.length - 1];
  if (!last || last.role !== 'user') {
    messages.push({
      role: 'user',
      content:
        'Open this section: react to what you built and ask your first question (or, on a light section, what they’d change). Call next_turn.',
    });
  }
  return messages;
}

function parseTurn(input: unknown): BohdiTurn | undefined {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) return undefined;
  const rec = input as Record<string, unknown>;
  const action = rec['action'];
  const message = rec['message'];
  if ((action !== 'ask' && action !== 'ready') || typeof message !== 'string') return undefined;
  const text = message.trim();
  if (text.length === 0) return undefined;
  return { action, message: text };
}

/** Run one Bohdi turn. Returns his next move (ask/ready). Throws ConversationError if
 *  no usable turn comes back within the attempt budget. Never persists anything. */
export async function bohdiConverse(args: ConverseArgs): Promise<BohdiTurn> {
  const system = buildConversationPrompt(args);
  const messages = buildMessages(args.conversation);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const resp = await withTimeout(
      (signal) =>
        anthropicClient().messages.create(
          {
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system,
            tools: [NEXT_TURN_TOOL],
            tool_choice: { type: 'tool', name: 'next_turn' },
            messages,
          },
          { signal },
        ),
      TIMEOUT_MS,
      'conversation',
    );

    const tu = resp.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    const turn = tu ? parseTurn(tu.input) : undefined;
    if (turn) {
      logger.info('editor: conversation turn', { section: args.section, action: turn.action });
      return turn;
    }

    // No usable turn — nudge and retry.
    messages.push({ role: 'assistant', content: resp.content });
    messages.push({ role: 'user', content: 'That was not a valid next_turn. Call next_turn with action and message.' });
  }

  throw new ConversationError(`Bohdi did not return a usable turn within ${MAX_ATTEMPTS} attempts.`);
}
