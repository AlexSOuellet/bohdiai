import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const messagesCreateMock = vi.fn();
vi.mock('@/lib/anthropic', () => ({
  anthropicClient: () => ({ messages: { create: messagesCreateMock } }),
}));

// Anything `tools.ts` imports that hits the network.
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
      }),
      insert: () => ({
        select: () => ({ single: () => Promise.resolve({ data: { id: null }, error: null }) }),
      }),
      update: () => ({
        is: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }),
      }),
    }),
  }),
}));

const writeStorefrontMock = vi.fn();
vi.mock('@/lib/generation/write-storefront', () => ({
  writeStorefront: (args: unknown) => writeStorefrontMock(args),
}));

vi.mock('@/lib/fal', () => ({
  generateHeroImage: vi.fn(),
  generateAboutImage: vi.fn(),
  generateProductImage: vi.fn(),
}));

// ─── Imports ─────────────────────────────────────────────────────────────────

import { runBohdi } from './run';
import type { BohdiBrief } from './types';

const VALID_TOKENS = {
  colors: {
    primary: '#2c6e49',
    accent: '#8ecae6',
    background: '#f5f0e8',
    surface: '#ffffff',
    text: '#1a1a1a',
    textMuted: '#6b6b6b',
    border: '#e0dbd2',
  },
  typography: {
    headingFont: 'Playfair Display',
    bodyFont: 'Inter',
    headingWeight: 700,
    headingLetterSpacing: '-0.02em',
    bodyLineHeight: '1.6',
    baseSize: '16px',
  },
  wordmark: {
    font: 'Bodoni Moda',
    treatment: 'solid',
    color1: '#1a1a1a',
    color2: '',
    letterSpacing: '-0.03em',
  },
  shape: { borderRadius: 'md', cardBorderRadius: 'lg' },
  spacing: { sectionPadding: 'normal', cardGap: 'normal' },
  layout: { heroStyle: 'full-bleed', productGridCols: 3, footerStyle: 'minimal' },
};

const VALID_HOME_PAGE = {
  blocks: [{ blockKey: 'hero-cinematic', position: 0, content: {} }],
};

const VALID_SECONDARY_COPY = {
  shop: { eyebrow: 'e', heading: 'h', subheading: 's' },
  contact: { heading: 'h', subheading: 's', buttonLabel: 'b' },
};

const VALID_ABOUT_PAGE = {
  eyebrow: 'e',
  headline: 'h',
  intro: 'i',
  body: 'b',
  signatureName: 'n',
  signatureRole: 'r',
};

function makeBrief(over: Partial<BohdiBrief> = {}): BohdiBrief {
  return {
    shopName: 'Acme',
    subdomain: 'acme',
    nicheSlug: 'leatherworker',
    moodKey: 'rustic',
    productCount: 1,
    ...over,
  };
}

// Helper: a scripted Anthropic response with one or more tool_use blocks.
function toolUseResponse(
  calls: Array<{ name: string; input: unknown; id?: string }>,
  fallbackId = 'tu',
) {
  return {
    stop_reason: 'tool_use' as const,
    content: calls.map((c, i) => ({
      type: 'tool_use',
      id: c.id ?? `${fallbackId}${i}`,
      name: c.name,
      input: c.input,
    })),
    usage: {
      input_tokens: 10,
      output_tokens: 5,
      cache_read_input_tokens: 0,
      cache_creation_input_tokens: 0,
    },
  };
}

function endTurnResponse() {
  return {
    stop_reason: 'end_turn' as const,
    content: [{ type: 'text', text: 'done' }],
    usage: { input_tokens: 1, output_tokens: 1 },
  };
}

// A full legacy build script: one turn sets everything, the next finalizes.
function scriptHappyPath() {
  messagesCreateMock
    .mockResolvedValueOnce(
      toolUseResponse([
        { name: 'set_tokens', input: VALID_TOKENS },
        { name: 'set_home_page', input: VALID_HOME_PAGE },
        { name: 'set_secondary_pages_copy', input: VALID_SECONDARY_COPY },
        { name: 'set_about_page', input: VALID_ABOUT_PAGE },
        { name: 'set_hero_image', input: { url: 'https://x/hero.png' } },
      ]),
    )
    .mockResolvedValueOnce(toolUseResponse([{ name: 'finalize', input: {}, id: 'fin' }]));
}

beforeEach(() => {
  messagesCreateMock.mockReset();
  writeStorefrontMock.mockReset();
});

describe('runBohdi — happy path', () => {
  it('runs the tool loop until finalize, emits progress, returns the result', async () => {
    writeStorefrontMock.mockResolvedValue({ tenantId: 't-1', subdomain: 'acme' });
    scriptHappyPath();

    const events: unknown[] = [];
    const r = await runBohdi(
      makeBrief({ makerName: 'Alex', logoUrl: 'https://x/l.png', brandColors: ['#abcdef'] }),
      (e) => events.push(e),
    );
    expect(r).toEqual({ tenantId: 't-1', subdomain: 'acme' });
    expect(messagesCreateMock).toHaveBeenCalledTimes(2);
    expect(events.length).toBeGreaterThan(0);
  });

  it('handles tool errors and passes is_error back to the model', async () => {
    writeStorefrontMock.mockResolvedValue({ tenantId: 't-2', subdomain: 'acme' });
    // Capture message snapshots at each call (messages is mutated across turns).
    const snapshots: Array<Array<{ role: string; content: unknown }>> = [];
    let call = 0;
    const scripted = [
      toolUseResponse([{ name: 'does-not-exist', input: {}, id: 'a' }]),
      toolUseResponse([
        { name: 'set_tokens', input: VALID_TOKENS },
        { name: 'set_home_page', input: VALID_HOME_PAGE },
        { name: 'set_secondary_pages_copy', input: VALID_SECONDARY_COPY },
        { name: 'set_about_page', input: VALID_ABOUT_PAGE },
        { name: 'set_hero_image', input: { url: 'https://x/hero.png' } },
      ]),
      toolUseResponse([{ name: 'finalize', input: {}, id: 'd' }]),
    ];
    messagesCreateMock.mockImplementation(
      (args: { messages: Array<{ role: string; content: unknown }> }) => {
        snapshots.push(JSON.parse(JSON.stringify(args.messages)));
        return Promise.resolve(scripted[call++]);
      },
    );

    const r = await runBohdi(makeBrief());
    expect(r.tenantId).toBe('t-2');
    // Snapshot of turn-2 messages — last message is the user tool_results from turn 1.
    const turn2 = snapshots[1];
    const lastUserMsg = turn2?.[turn2.length - 1];
    const blocks = lastUserMsg?.content as Array<{
      is_error?: boolean;
      type?: string;
      content?: string;
    }>;
    const errResult = blocks?.find((b) => b.type === 'tool_result');
    expect(errResult?.is_error).toBe(true);
    expect(errResult?.content).toContain('Unknown tool');
  });

  it('skips non-tool_use content blocks within a turn', async () => {
    writeStorefrontMock.mockResolvedValue({ tenantId: 't-3', subdomain: 'acme' });
    messagesCreateMock
      .mockResolvedValueOnce({
        stop_reason: 'tool_use',
        content: [
          { type: 'text', text: 'thinking' },
          { type: 'tool_use', id: 'x0', name: 'set_tokens', input: VALID_TOKENS },
          { type: 'tool_use', id: 'x1', name: 'set_home_page', input: VALID_HOME_PAGE },
          {
            type: 'tool_use',
            id: 'x2',
            name: 'set_secondary_pages_copy',
            input: VALID_SECONDARY_COPY,
          },
          { type: 'tool_use', id: 'x3', name: 'set_about_page', input: VALID_ABOUT_PAGE },
          {
            type: 'tool_use',
            id: 'x4',
            name: 'set_hero_image',
            input: { url: 'https://x/hero.png' },
          },
        ],
        usage: { input_tokens: 1, output_tokens: 1 },
      })
      .mockResolvedValueOnce(toolUseResponse([{ name: 'finalize', input: {}, id: 'fin' }]));

    const r = await runBohdi(makeBrief());
    expect(r.tenantId).toBe('t-3');
  });
});

describe('runBohdi — error paths', () => {
  it('throws when the model ends turn before finalize', async () => {
    messagesCreateMock.mockResolvedValueOnce(endTurnResponse());
    await expect(runBohdi(makeBrief())).rejects.toThrow('Bohdi stopped before finalize');
  });

  it('bails on unexpected stop_reason and then throws (no finalize)', async () => {
    messagesCreateMock.mockResolvedValueOnce({
      stop_reason: 'max_tokens',
      content: [],
      usage: { input_tokens: 1, output_tokens: 1 },
    });
    await expect(runBohdi(makeBrief())).rejects.toThrow('did not finalize');
  });

  it('throws after MAX_TURNS without finalize', async () => {
    // Each turn does a no-op tool call (set_tokens again).
    messagesCreateMock.mockResolvedValue(
      toolUseResponse([{ name: 'set_tokens', input: VALID_TOKENS, id: 'loop' }]),
    );
    await expect(runBohdi(makeBrief())).rejects.toThrow('did not finalize');
  }, 30_000);

  it('rejects instead of hanging when a model turn stalls past the timeout', async () => {
    vi.useFakeTimers();
    try {
      messagesCreateMock.mockReturnValue(new Promise(() => {})); // never settles
      const pending = runBohdi(makeBrief());
      const assertion = expect(pending).rejects.toThrow(/timed out/);
      await vi.advanceTimersByTimeAsync(200_000);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });
});
