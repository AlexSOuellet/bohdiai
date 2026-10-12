import { describe, it, expect, vi } from 'vitest';
import { parseSignup, beehiivConfig, subscribe } from './subscribe';

describe('parseSignup', () => {
  it('accepts and tidies an email', () => {
    expect(parseSignup({ email: '  Pat@Example.com ' })).toEqual({ kind: 'ok', email: 'pat@example.com' });
  });
  it('turns away bots quietly', () => {
    expect(parseSignup({ email: 'a@b.co', company: 'x' })).toEqual({ kind: 'spam' });
  });
  it('explains what’s wrong', () => {
    expect(parseSignup(null)).toEqual({ kind: 'invalid', error: 'Please enter your email.' });
    expect(parseSignup([])).toEqual({ kind: 'invalid', error: 'Please enter your email.' });
    expect(parseSignup({ email: ' ' })).toEqual({ kind: 'invalid', error: 'Please enter your email.' });
    expect(parseSignup({ email: 'nope' })).toEqual({
      kind: 'invalid',
      error: 'That email doesn’t look right. Please check it.',
    });
  });
});

describe('beehiivConfig', () => {
  it('needs both keys', () => {
    expect(beehiivConfig({ BEEHIIV_API_KEY: 'k', BEEHIIV_PUBLICATION_ID: 'pub_1' })).toEqual({
      apiKey: 'k',
      publicationId: 'pub_1',
    });
    expect(beehiivConfig({ BEEHIIV_API_KEY: 'k' })).toBeNull();
    expect(beehiivConfig({ BEEHIIV_API_KEY: ' ', BEEHIIV_PUBLICATION_ID: 'p' })).toBeNull();
    expect(beehiivConfig({})).toBeNull();
  });
});

describe('subscribe', () => {
  const config = { apiKey: 'key', publicationId: 'pub_1' };

  it('posts the email to the publication with the checkup as source', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('{}', { status: 201 }));
    expect(await subscribe('pat@example.com', config, fetcher)).toEqual({ ok: true });
    const [url, init] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.beehiiv.com/v2/publications/pub_1/subscriptions');
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer key');
    expect(JSON.parse(String(init.body))).toMatchObject({ email: 'pat@example.com', utm_source: 'maker-checkup' });
  });

  it('reports a rejection', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('bad key', { status: 401 }));
    expect(await subscribe('pat@example.com', config, fetcher)).toEqual({ ok: false, status: 401, detail: 'bad key' });
  });
});
