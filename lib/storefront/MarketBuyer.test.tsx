import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import type { ProductView } from '@/lib/archetypes/content';
import { keyWords } from '@/lib/site-words/words';
import { FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX } from '@/lib/archetypes/main-street/words';
import { MarketBuyer } from './MarketBuyer';

const K = keyWords(FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX);
/** Test words: every spot says its own key; the "left" spot keeps its blank. */
const S = { ...K.market, left: '{n} left' };

const fetchMock = vi.fn();
globalThis.fetch = fetchMock as unknown as typeof fetch;
const reply = (status: number, body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status }));

afterEach(() => {
  cleanup();
  fetchMock.mockReset();
});

const MARKET = '00000000-0000-4000-8000-0000000000e1';
const mug: ProductView = { id: 'mug', slug: 'mug', name: 'Mug', price: '$20', description: '', status: 'active', media: [], variations: [] };
const scarf: ProductView = { id: 'scarf', slug: 'scarf', name: 'Scarf', price: '$30', description: '', status: 'active', media: [], variations: [{ name: 'Colour', options: ['Blue', 'Red'] }] };

function sent(): Record<string, unknown> {
  const call = fetchMock.mock.calls[0] as [string, { body: string }];
  return JSON.parse(call[1].body) as Record<string, unknown>;
}

describe('MarketBuyer at a counted market', () => {
  it('shows what’s left of a counted piece, and asks how many', async () => {
    fetchMock.mockReturnValueOnce(reply(200, { ok: true, orderId: 'o1', orderNumber: '1004', piece: '2 × Mug', amount: '$40', discount: null, pay: { method: 'cash' } }));
    render(<MarketBuyer marketId={MARKET} pieces={[mug]} stock={{ mug: { left: 3, options: [] } }} methods={['cash']} strings={S} prefix="ms" />);
    expect(screen.getByText('3 left')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^Mug/ }));
    const qty = screen.getByLabelText(S.quantity) as HTMLInputElement;
    expect(qty.max).toBe('3');
    fireEvent.change(qty, { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText(S.yourName), { target: { value: 'Pat' } });
    fireEvent.click(screen.getByRole('button', { name: S.continue }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(sent()).toMatchObject({ eventId: MARKET, listingId: 'mug', quantity: 2, name: 'Pat', method: 'cash' });
    expect(sent()).not.toHaveProperty('variantId');
  });

  it('asks which option, each with its price and what’s left; a gone one can’t be picked', async () => {
    fetchMock.mockReturnValueOnce(reply(200, { ok: true, orderId: 'o1', orderNumber: '1004', piece: 'Scarf, Red', amount: '$30', discount: null, pay: { method: 'cash' } }));
    render(
      <MarketBuyer
        marketId={MARKET}
        pieces={[scarf]}
        stock={{ scarf: { left: null, options: [{ id: 'v1', label: 'Blue', price: '$28', left: 0 }, { id: 'v2', label: 'Red', price: '$30', left: 2 }] } }}
        methods={['cash']}
        strings={S}
        prefix="ms"
      />,
    );
    expect(screen.getByText('2 left')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^Scarf/ }));
    expect(screen.getByText(S.option)).toBeTruthy();
    const blue = screen.getByRole('radio', { name: /Blue/ }) as HTMLInputElement;
    const red = screen.getByRole('radio', { name: /Red/ }) as HTMLInputElement;
    expect(blue.disabled).toBe(true);
    expect(red.checked).toBe(true);
    expect(screen.getByText(S.gone)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(S.yourName), { target: { value: 'Pat' } });
    fireEvent.click(screen.getByRole('button', { name: S.continue }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(sent()).toMatchObject({ listingId: 'scarf', variantId: 'v2', quantity: 1 });
  });

  it('asks no count for the last one, and says nothing of what’s left when nothing is counted', () => {
    render(<MarketBuyer marketId={MARKET} pieces={[mug, { ...scarf, id: 'other', slug: 'other' }]} stock={{ mug: { left: 1, options: [] }, other: { left: null, options: [{ id: 'v1', label: 'Blue', price: '$28', left: null }] } }} methods={['cash']} strings={S} prefix="ms" />);
    expect(screen.getByText('1 left')).toBeTruthy();
    expect(screen.queryAllByText(/left$/)).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /^Mug/ }));
    expect(screen.queryByLabelText(S.quantity)).toBeNull();
  });

  it('works as before with no counts at all', () => {
    render(<MarketBuyer marketId={MARKET} pieces={[mug]} methods={['cash']} strings={S} prefix="ms" />);
    fireEvent.click(screen.getByRole('button', { name: /^Mug/ }));
    expect((screen.getByLabelText(S.quantity) as HTMLInputElement).max).toBe('99');
  });
});
