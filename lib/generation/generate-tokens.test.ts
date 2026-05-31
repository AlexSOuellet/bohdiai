import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MOODS } from '@/lib/moods';
import type { DesignTokens } from '@/lib/tokens';

const messagesCreateMock = vi.fn();
const existsSyncMock = vi.fn();
const readFileSyncMock = vi.fn();
const enforceTokenContrastMock = vi.fn();

vi.mock('@/lib/anthropic', () => ({
  anthropicClient: () => ({ messages: { create: messagesCreateMock } }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/contrast', () => ({
  enforceTokenContrast: (tokens: DesignTokens, opts: { skipAccent?: boolean }) =>
    enforceTokenContrastMock(tokens, opts),
}));

vi.mock('node:fs', () => ({
  default: {
    existsSync: (...a: unknown[]) => existsSyncMock(...a),
    readFileSync: (...a: unknown[]) => readFileSyncMock(...a),
  },
  existsSync: (...a: unknown[]) => existsSyncMock(...a),
  readFileSync: (...a: unknown[]) => readFileSyncMock(...a),
}));

// Import after mocks
import { generateTokens } from './generate-tokens';

const MOOD = MOODS.rustic;

const VALID_TOKENS: DesignTokens = {
  colors: {
    primary: '#111111',
    accent: '#888888',
    background: '#ffffff',
    surface: '#fafafa',
    text: '#000000',
    textMuted: '#666666',
    border: '#dddddd',
  },
  typography: {
    headingFont: 'Inter',
    bodyFont: 'Inter',
    headingWeight: 700,
    headingLetterSpacing: '-0.02em',
    bodyLineHeight: '1.6',
    baseSize: '16px',
  },
  wordmark: {
    font: 'Playfair',
    treatment: 'solid',
    color1: '#111111',
    color2: '',
    letterSpacing: '-0.03em',
  },
  shape: { borderRadius: 'md', cardBorderRadius: 'lg' },
  spacing: { sectionPadding: 'normal', cardGap: 'normal' },
  layout: { heroStyle: 'full-bleed', productGridCols: 3, footerStyle: 'minimal' },
};

const SHEET_JSON = JSON.stringify({
  palette: [{ name: 'cream', hex: '#fff5e6' }],
  fonts: [{ name: 'Inter', category: 'sans' }],
  textures: ['linen'],
});

function mockResponse(text: string) {
  return {
    model: 'claude-sonnet-4-6',
    content: [{ type: 'text', text }],
    usage: { input_tokens: 1, output_tokens: 1 },
  };
}

describe('generateTokens', () => {
  beforeEach(() => {
    messagesCreateMock.mockReset();
    existsSyncMock.mockReset();
    readFileSyncMock.mockReset();
    enforceTokenContrastMock.mockReset();
    enforceTokenContrastMock.mockImplementation((t: DesignTokens) => t);
  });

  it('returns parsed tokens on happy path (no sheets, no brand colors)', async () => {
    existsSyncMock.mockReturnValue(false);
    messagesCreateMock.mockResolvedValue(mockResponse(JSON.stringify(VALID_TOKENS)));
    const r = await generateTokens('niche body', MOOD);
    expect(r.colors.primary).toBe('#111111');
    expect(enforceTokenContrastMock).toHaveBeenCalledWith(expect.anything(), { skipAccent: false });
  });

  it('loads niche + mood sheets when present and sets skipAccent true', async () => {
    existsSyncMock.mockReturnValue(true);
    readFileSyncMock.mockReturnValue(SHEET_JSON);
    messagesCreateMock.mockResolvedValue(mockResponse(JSON.stringify(VALID_TOKENS)));
    await generateTokens('body', MOOD, 'tenant', 'candles');
    expect(enforceTokenContrastMock).toHaveBeenCalledWith(expect.anything(), { skipAccent: true });
    const prompt = messagesCreateMock.mock.calls[0]?.[0].messages[0].content as string;
    expect(prompt).toContain('NICHE STYLE SHEET');
    expect(prompt).toContain('MOOD STYLE SHEET');
  });

  it('handles JSON parse errors in sheet files (returns null sheet)', async () => {
    existsSyncMock.mockReturnValue(true);
    readFileSyncMock.mockReturnValue('not json');
    messagesCreateMock.mockResolvedValue(mockResponse(JSON.stringify(VALID_TOKENS)));
    const r = await generateTokens('body', MOOD, undefined, 'candles');
    expect(r.colors.primary).toBe('#111111');
    expect(enforceTokenContrastMock).toHaveBeenCalledWith(expect.anything(), { skipAccent: false });
  });

  it('skips niche sheet load when nicheSlug is undefined', async () => {
    existsSyncMock.mockReturnValue(true);
    readFileSyncMock.mockReturnValue(SHEET_JSON);
    messagesCreateMock.mockResolvedValue(mockResponse(JSON.stringify(VALID_TOKENS)));
    await generateTokens('body', MOOD);
    // mood sheet still loads since existsSync returns true; nicheSheet is null because nicheSlug undefined
    expect(enforceTokenContrastMock).toHaveBeenCalledWith(expect.anything(), { skipAccent: false });
  });

  it('includes brand colors block when provided', async () => {
    existsSyncMock.mockReturnValue(false);
    messagesCreateMock.mockResolvedValue(mockResponse(JSON.stringify(VALID_TOKENS)));
    await generateTokens('body', MOOD, 't', 'candles', ['#aabbcc', '#112233']);
    const prompt = messagesCreateMock.mock.calls[0]?.[0].messages[0].content as string;
    expect(prompt).toContain('BRAND COLORS');
    expect(prompt).toContain('#aabbcc');
  });

  it('omits brand colors block when empty array', async () => {
    existsSyncMock.mockReturnValue(false);
    messagesCreateMock.mockResolvedValue(mockResponse(JSON.stringify(VALID_TOKENS)));
    await generateTokens('body', MOOD, 't', 'candles', []);
    const prompt = messagesCreateMock.mock.calls[0]?.[0].messages[0].content as string;
    expect(prompt).not.toContain('BRAND COLORS');
  });

  it('throws on missing JSON', async () => {
    existsSyncMock.mockReturnValue(false);
    messagesCreateMock.mockResolvedValue(mockResponse('no json'));
    await expect(generateTokens('body', MOOD)).rejects.toThrow(
      'No JSON object found in AI response',
    );
  });

  it('throws on schema validation failure', async () => {
    existsSyncMock.mockReturnValue(false);
    messagesCreateMock.mockResolvedValue(mockResponse(JSON.stringify({ colors: { primary: 1 } })));
    await expect(generateTokens('body', MOOD)).rejects.toThrow();
  });

  it('throws when content is not text', async () => {
    existsSyncMock.mockReturnValue(false);
    messagesCreateMock.mockResolvedValue({
      model: 'm',
      content: [{ type: 'tool_use' }],
      usage: { input_tokens: 1, output_tokens: 1 },
    });
    await expect(generateTokens('body', MOOD)).rejects.toThrow();
  });
});
