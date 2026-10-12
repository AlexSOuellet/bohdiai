import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import type { ProductView } from '@/lib/archetypes/content';
import { ShorelineMarketBuyer } from './ShorelineMarketBuyer';
import { CARD_STRINGS as S } from './strings';

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
  // The server page hands over only plain data; the words (some are functions)
  // are read here on the client. Passing them from the server crashed the page.
  it('takes only plain data and shows the shoreline words', () => {
    render(<ShorelineMarketBuyer marketId="00000000-0000-4000-8000-0000000000e1" pieces={[piece]} methods={['venmo', 'cash']} codes={false} />);
    expect(screen.getByText(S.shoreline.market.pick)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Lighthouse ring dish/ })).toBeTruthy();
  });

  it('has no links while buying, and one way to the shop once done', async () => {
    fetchMock.mockReturnValueOnce(reply(200, { ok: true, orderId: 'o1', orderNumber: '1004', piece: piece.name, amount: '$28', discount: null, pay: { method: 'cash' } }));
    fetchMock.mockReturnValueOnce(reply(200, { ok: true }));
    const { container } = render(<ShorelineMarketBuyer marketId="00000000-0000-4000-8000-0000000000e1" pieces={[piece]} methods={['cash']} codes={false} />);
    expect(container.querySelectorAll('a')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: /Lighthouse ring dish/ }));
    fireEvent.change(screen.getByLabelText(S.shoreline.market.yourName), { target: { value: 'Pat' } });
    fireEvent.click(screen.getByRole('button', { name: S.shoreline.market.continue }));
    await waitFor(() => expect(screen.getByRole('button', { name: S.shoreline.market.paid })).toBeTruthy());
    expect(container.querySelectorAll('a')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: S.shoreline.market.paid }));
    await waitFor(() => expect(screen.getByText(S.shoreline.market.doneTitle('Pat'))).toBeTruthy());
    expect(screen.getByRole('link', { name: S.shoreline.market.toShop }).getAttribute('href')).toBe('/shop');
  });
});
