import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { EMPTY_PROFILE } from '@/lib/backend/profile/profile-form';
import type { MarketShopView, ProductView } from '@/lib/archetypes/content';
import { NurseryMarket } from './NurseryLanding';
import { NurseryMarketBuyer } from './NurseryMarketBuyer';
import { NURSERY_STRINGS as S } from './strings';
import type { BoutiqueData } from './data';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const baby = (name: string, extra: Partial<ProductView> = {}): ProductView => ({
  id: `00000000-0000-4000-8000-00000000000${name.length}`,
  slug: name.toLowerCase(),
  name,
  price: '$120',
  description: '',
  status: 'active',
  media: [{ kind: 'image', url: `https://cdn/${name}.webp`, alt: name }],
  variations: [],
  ...extra,
});

const data: BoutiqueData = { name: 'Rose n’ Cat', profile: EMPTY_PROFILE, dates: [], gone: [], cart: false, newArrivals: false, sale: null };
const market = (over: Partial<MarketShopView> = {}): MarketShopView => ({
  marketId: '00000000-0000-4000-8000-0000000000e1',
  name: 'Holly Fair',
  date: '2026-11-21',
  endDate: '',
  town: 'Johnston',
  booth: 'Booth 4',
  state: 'open',
  pieces: [baby('Theo'), baby('Rosie', { status: 'sold_out' })],
  methods: ['venmo', 'cash'],
  codes: true,
  ...over,
});

const fetchMock = vi.fn();
globalThis.fetch = fetchMock as unknown as typeof fetch;
const reply = (status: number, body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status }));

afterEach(() => {
  cleanup();
  fetchMock.mockReset();
});

describe('market page', () => {
  it('names the market and where to find her', () => {
    render(<NurseryMarket data={data} market={market()} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Holly Fair' })).toBeTruthy();
    expect(screen.getByText(/Saturday · Nov 21 · Johnston · Booth 4/)).toBeTruthy();
  });

  it('shows who is coming before the market, and points to the site after', () => {
    const { rerender } = render(<NurseryMarket data={data} market={market({ state: 'before' })} />);
    expect(screen.getByText(S.market.before('Saturday'))).toBeTruthy();
    expect(screen.queryByText(S.market.pick)).toBeNull();
    rerender(<NurseryMarket data={data} market={market({ state: 'after' })} />);
    expect(screen.getByText(S.market.after)).toBeTruthy();
    rerender(<NurseryMarket data={data} market={market({ state: 'canceled' })} />);
    expect(screen.getByText(S.market.canceled)).toBeTruthy();
    rerender(<NurseryMarket data={data} market={market({ methods: [] })} />);
    expect(screen.getByText(S.market.noPay)).toBeTruthy();
  });
});

describe('buying at the table', () => {
  const props = { marketId: '00000000-0000-4000-8000-0000000000e1', pieces: [baby('Theo'), baby('Rosie', { status: 'sold_out' })], methods: ['venmo', 'zelle', 'cash'] as const, codes: true };

  it('picks a baby, holds it, pays with Venmo and says so', async () => {
    fetchMock.mockReturnValueOnce(
      reply(200, { ok: true, orderId: 'o1', orderNumber: '1004', piece: 'Theo', amount: '$108', discount: { label: 'MARKET10', amount: '$12' }, pay: { method: 'venmo', link: 'https://venmo.com/renee?txn=pay', handle: '@renee' } }),
    );
    fetchMock.mockReturnValueOnce(reply(200, { ok: true }));
    render(<NurseryMarketBuyer {...props} methods={[...props.methods]} />);
    expect((screen.getByRole('button', { name: /Rosie/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /Theo/ }));
    fireEvent.change(screen.getByLabelText(S.market.yourName), { target: { value: 'Pat' } });
    fireEvent.change(screen.getByLabelText(S.market.code), { target: { value: 'market10' } });
    fireEvent.click(screen.getByRole('button', { name: S.market.continue }));
    await waitFor(() => expect(screen.getByText(S.market.payTitle('Theo'))).toBeTruthy());
    const sent = JSON.parse(String((fetchMock.mock.calls[0]?.[1] as RequestInit).body)) as Record<string, string>;
    expect(sent).toMatchObject({ listingId: props.pieces[0]?.id, name: 'Pat', method: 'venmo', code: 'market10' });
    expect(screen.getByText('$108')).toBeTruthy();
    expect(screen.getByText(S.market.discount('MARKET10', '$12'))).toBeTruthy();
    expect(screen.getByRole('link', { name: S.market.open('Venmo') }).getAttribute('href')).toBe('https://venmo.com/renee?txn=pay');
    fireEvent.click(screen.getByRole('button', { name: S.market.paid }));
    await waitFor(() => expect(screen.getByText(S.market.doneTitle('Pat'))).toBeTruthy());
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/api/market/paid');
  });

  it('shows the Zelle handle to copy, and lets the buyer step back', async () => {
    fetchMock.mockReturnValueOnce(reply(200, { ok: true, orderId: 'o1', orderNumber: '1004', piece: 'Theo', amount: '$120', discount: null, pay: { method: 'zelle', handle: 'r@x.com' } }));
    fetchMock.mockReturnValueOnce(reply(200, { ok: true }));
    render(<NurseryMarketBuyer {...props} methods={[...props.methods]} />);
    fireEvent.click(screen.getByRole('button', { name: /Theo/ }));
    fireEvent.change(screen.getByLabelText(S.market.yourName), { target: { value: 'Pat' } });
    fireEvent.click(screen.getByText('Zelle'));
    fireEvent.click(screen.getByRole('button', { name: S.market.continue }));
    await waitFor(() => expect(screen.getByText(/Send it with Zelle to r@x.com/)).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: S.market.another }));
    await waitFor(() => expect(screen.getByText(S.market.pick)).toBeTruthy());
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/api/market/release');
  });

  it('says why a hold failed and stays put', async () => {
    fetchMock.mockReturnValueOnce(reply(409, { error: 'Sorry, that one was just taken. Pick another.' }));
    render(<NurseryMarketBuyer {...props} methods={['cash']} codes={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Theo/ }));
    expect(screen.queryByLabelText(S.market.code)).toBeNull();
    fireEvent.change(screen.getByLabelText(S.market.yourName), { target: { value: 'Pat' } });
    fireEvent.click(screen.getByRole('button', { name: S.market.continue }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Sorry, that one was just taken. Pick another.'));
  });

  it('says so when the connection drops, and when no babies are listed', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    render(<NurseryMarketBuyer {...props} methods={['cash']} />);
    fireEvent.click(screen.getByRole('button', { name: /Theo/ }));
    fireEvent.change(screen.getByLabelText(S.market.yourName), { target: { value: 'Pat' } });
    fireEvent.click(screen.getByRole('button', { name: S.market.continue }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(S.market.errorNetwork));
    cleanup();
    render(<NurseryMarketBuyer {...props} pieces={[]} methods={['cash']} />);
    expect(screen.getByText(S.market.none)).toBeTruthy();
  });
});
