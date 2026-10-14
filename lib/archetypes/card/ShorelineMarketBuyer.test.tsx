import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import type { ProductView } from '@/lib/archetypes/content';
import { ShorelineMarketBuyer } from './ShorelineMarketBuyer';
import { fill, keyWords } from '@/lib/site-words/words';
import { CARD_WORD_SPOTS, CARD_WORDS_PREFIX, type CardWords } from './words';

const K = keyWords(CARD_WORD_SPOTS, CARD_WORDS_PREFIX);
/** Test words: every spot says its own key; a spot with blanks keeps them. */
const S: CardWords = { ...K, shoreline: { ...K.shoreline, market: { ...K.shoreline.market, doneTitle: 'card.shoreline.market.doneTitle {name}' } } };

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const fetchMock = vi.fn();
globalThis.fetch = fetchMock as unknown as typeof fetch;
const reply = (status: number, body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status }));

afterEach(() => {
  cleanup();
  fetchMock.mockReset();
});

const piece: ProductView = {
  id: '00000000-0000-4000-8000-000000000001',
  slug: 'lighthouse-ring-dish',
  name: 'Lighthouse ring dish',
  price: '$28',
  description: '',
  status: 'active',
  media: [],
  variations: [],
};

describe('ShorelineMarketBuyer', () => {
  // The server page hands over only plain data: the site's words are plain text
  // now (blanks filled on the client), so they cross from the server safely.
  it('takes only plain data and shows the shoreline words', () => {
    render(<ShorelineMarketBuyer marketId="00000000-0000-4000-8000-0000000000e1" pieces={[piece]} methods={['venmo', 'cash']} w={S.shoreline.market} />);
    expect(screen.getByText(S.shoreline.market.pick)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Lighthouse ring dish/ })).toBeTruthy();
  });

  it('has no links while buying, and one way to the shop once done', async () => {
    fetchMock.mockReturnValueOnce(reply(200, { ok: true, orderId: 'o1', orderNumber: '1004', piece: piece.name, amount: '$28', discount: null, pay: { method: 'cash' } }));
    fetchMock.mockReturnValueOnce(reply(200, { ok: true }));
    const { container } = render(<ShorelineMarketBuyer marketId="00000000-0000-4000-8000-0000000000e1" pieces={[piece]} methods={['cash']} w={S.shoreline.market} />);
    expect(container.querySelectorAll('a')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: /Lighthouse ring dish/ }));
    fireEvent.change(screen.getByLabelText(S.shoreline.market.yourName), { target: { value: 'Pat' } });
    fireEvent.click(screen.getByRole('button', { name: S.shoreline.market.continue }));
    await waitFor(() => expect(screen.getByRole('button', { name: S.shoreline.market.paid })).toBeTruthy());
    expect(container.querySelectorAll('a')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: S.shoreline.market.paid }));
    await waitFor(() => expect(screen.getByText(fill(S.shoreline.market.doneTitle, { name: 'Pat' }))).toBeTruthy());
    expect(screen.getByRole('link', { name: S.shoreline.market.toShop }).getAttribute('href')).toBe('/shop');
  });
});
