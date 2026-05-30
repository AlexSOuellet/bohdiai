import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const messagesCreateMock = vi.fn();
vi.mock('@/lib/anthropic', () => ({
  anthropicClient: () => ({ messages: { create: messagesCreateMock } }),
}));

// Anything `tools.ts` and `layout-tools.ts` import that hits the network.
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: { id: null }, error: null }) }) }),
      update: () => ({ is: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }) }),
    }),
  }),
}));

const writeStorefrontLayoutMock = vi.fn();
vi.mock('@/lib/generation/write-storefront-layout', () => ({
  writeStorefrontLayout: (args: unknown) => writeStorefrontLayoutMock(args),
}));

vi.mock('@/lib/fal', () => ({
  generateHeroImage: vi.fn(),
  generateAboutImage: vi.fn(),
  generateProductImage: vi.fn(),
}));

// ─── Imports ─────────────────────────────────────────────────────────────────

import { runBohdi } from './run';
import type { BohdiBrief } from './types';

const VALID_STYLE_SHEET = {
  palette: [
    { name: 'A', value: '#a0522d', character: 'one' },
    { name: 'B', value: '#f5f0e8', character: 'two' },
    { name: 'C', value: '#1a1a1a', character: 'three' },
  ],
  fonts: [
    { name: 'D', family: 'Cormorant', source: 'google', weights: [400], fallback: 'serif', character: 'one' },
    { name: 'E', family: 'Inter', source: 'google', weights: [400], fallback: 'sans-serif', character: 'two' },
  ],
  textures: [],
};

const VALID_LAYOUT = {
  slug: 'home', name: 'Home',
  root: { type: 'text', role: 'body', content: 'hi' },
};

function makeBrief(over: Partial<BohdiBrief> = {}): BohdiBrief {
  return {
    shopName: 'Acme',
    subdomain: 'acme',
    nicheSlug: 'candles',
    moodKey: 'rustic',
    productCount: 1,
    ...over,
  };
}

// Helper: a scripted Anthropic response with one tool_use block.
function toolUseResponse(name: string, input: unknown, id = 'tu1') {
  return {
    stop_reason: 'tool_use' as const,
    content: [{ type: 'tool_use', id, name, input }],
    usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
  };
}

function endTurnResponse() {
  return {
    stop_reason: 'end_turn' as const,
    content: [{ type: 'text', text: 'done' }],
    usage: { input_tokens: 1, output_tokens: 1 },
  };
}

beforeEach(() => {
  messagesCreateMock.mockReset();
  writeStorefrontLayoutMock.mockReset();
});

describe('runBohdi — happy path', () => {
  it('runs the tool loop until finalize, emits progress, returns the result', async () => {
    writeStorefrontLayoutMock.mockResolvedValue({ tenantId: 't-1', subdomain: 'acme' });

    // Script: turn 1 = set_style_sheet, turn 2 = set_layout, turn 3 = finalize.
    messagesCreateMock
      .mockResolvedValueOnce(toolUseResponse('set_style_sheet', VALID_STYLE_SHEET, 'a'))
      .mockResolvedValueOnce(toolUseResponse('set_layout', VALID_LAYOUT, 'b'))
      .mockResolvedValueOnce(toolUseResponse('finalize', {}, 'c'));

    const events: unknown[] = [];
    const r = await runBohdi(makeBrief({ makerName: 'Alex', logoUrl: 'https://x/l.png', brandColors: ['#abcdef'] }), (e) => events.push(e));
    expect(r).toEqual({ tenantId: 't-1', subdomain: 'acme' });
    expect(messagesCreateMock).toHaveBeenCalledTimes(3);
    expect(events.length).toBeGreaterThan(0);
  });

  it('handles tool errors and passes is_error back to the model', async () => {
    writeStorefrontLayoutMock.mockResolvedValue({ tenantId: 't-2', subdomain: 'acme' });
    // Capture message snapshots at each call (messages is mutated across turns).
    const snapshots: Array<Array<{ role: string; content: unknown }>> = [];
    let call = 0;
    const scripted = [
      toolUseResponse('does-not-exist', {}, 'a'),
      toolUseResponse('set_style_sheet', VALID_STYLE_SHEET, 'b'),
      toolUseResponse('set_layout', VALID_LAYOUT, 'c'),
      toolUseResponse('finalize', {}, 'd'),
    ];
    messagesCreateMock.mockImplementation((args: { messages: Array<{ role: string; content: unknown }> }) => {
      snapshots.push(JSON.parse(JSON.stringify(args.messages)));
      return Promise.resolve(scripted[call++]);
    });

    const r = await runBohdi(makeBrief());
    expect(r.tenantId).toBe('t-2');
    // Snapshot of turn-2 messages — last message is the user tool_results from turn 1.
    const turn2 = snapshots[1];
    const lastUserMsg = turn2?.[turn2.length - 1];
    const blocks = lastUserMsg?.content as Array<{ is_error?: boolean; type?: string; content?: string }>;
    const errResult = blocks?.find((b) => b.type === 'tool_result');
    expect(errResult?.is_error).toBe(true);
    expect(errResult?.content).toContain('Unknown tool');
  });

  it('skips non-tool_use content blocks within a turn', async () => {
    writeStorefrontLayoutMock.mockResolvedValue({ tenantId: 't-3', subdomain: 'acme' });
    messagesCreateMock
      .mockResolvedValueOnce({
        stop_reason: 'tool_use',
        content: [
          { type: 'text', text: 'thinking' },
          { type: 'tool_use', id: 'x', name: 'set_style_sheet', input: VALID_STYLE_SHEET },
        ],
        usage: { input_tokens: 1, output_tokens: 1 },
      })
      .mockResolvedValueOnce(toolUseResponse('set_layout', VALID_LAYOUT, 'b'))
      .mockResolvedValueOnce(toolUseResponse('finalize', {}, 'c'));

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
    // Each turn does a no-op tool call (set_style_sheet again).
    messagesCreateMock.mockResolvedValue(toolUseResponse('set_style_sheet', VALID_STYLE_SHEET, 'loop'));
    await expect(runBohdi(makeBrief())).rejects.toThrow('did not finalize');
  }, 30_000);
});
