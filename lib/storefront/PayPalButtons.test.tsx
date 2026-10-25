import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { PayPalButtons } from './PayPalButtons';

type Options = Parameters<NonNullable<Window['paypal']>['Buttons']>[0];

const pay = { clientId: 'client', merchantId: 'M1', currency: 'USD' };
const w = { paying: 'Finishing…', payError: 'Didn’t go through.', payCancelled: 'You closed PayPal.', payUnavailable: 'Can’t load.', errorNetwork: 'No connection.' };
let opts: Options | null;
const close = vi.fn(async () => undefined);
const fetchMock = vi.fn();

function installPayPal(): void {
  window.paypal = {
    Buttons: (o) => {
      opts = o;
      return { render: async () => undefined, close };
    },
  };
}
const json = (status: number, body: unknown): Response => new Response(JSON.stringify(body), { status });
const actions = () => ({ reject: vi.fn(async () => undefined), resolve: vi.fn(async () => undefined) });

beforeEach(() => {
  opts = null;
  installPayPal();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  delete window.paypal;
  document.head.querySelectorAll('script').forEach((s) => s.remove());
  vi.unstubAllGlobals();
});

async function drawn(details: () => Record<string, unknown> | null = () => ({ name: 'Pat' }), onPaid = vi.fn()): Promise<{ o: Options; onPaid: typeof onPaid; unmount: () => void }> {
  const r = render(<PayPalButtons pay={pay} details={details} w={w} onPaid={onPaid} />);
  await waitFor(() => expect(opts).not.toBeNull());
  return { o: opts as Options, onPaid, unmount: r.unmount };
}

describe('PayPalButtons', () => {
  it('only opens PayPal once the shopper’s details are filled in', async () => {
    let ok = false;
    const { o } = await drawn(() => (ok ? { name: 'Pat' } : null));
    const a = actions();
    await o.onClick({}, a);
    expect(a.reject).toHaveBeenCalled();
    ok = true;
    const b = actions();
    await o.onClick({}, b);
    expect(b.resolve).toHaveBeenCalled();
  });

  it('pays: our server creates the payment, then records it once PayPal confirms', async () => {
    const { o, onPaid } = await drawn();
    fetchMock.mockResolvedValueOnce(json(200, { ok: true, paypalOrderId: 'PP1' }));
    expect(await o.createOrder()).toBe('PP1');
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/checkout/paypal/create');
    fetchMock.mockResolvedValueOnce(json(200, { ok: true, orderNumber: '1001' }));
    await act(() => o.onApprove({ orderID: 'PP1' }));
    expect(JSON.parse(String((fetchMock.mock.calls[1]?.[1] as RequestInit).body))).toEqual({ paypalOrderId: 'PP1' });
    expect(onPaid).toHaveBeenCalledWith('1001');
  });

  it('a paid order without a number still says thank you', async () => {
    const { o, onPaid } = await drawn();
    fetchMock.mockResolvedValueOnce(json(200, { ok: true }));
    await act(() => o.onApprove({ orderID: 'PP1' }));
    expect(onPaid).toHaveBeenCalledWith(null);
  });

  it('shows the shop’s reason when the order can’t be created', async () => {
    const { o } = await drawn();
    fetchMock.mockResolvedValueOnce(json(409, { error: 'No longer available: Theo.' }));
    await act(async () => {
      await expect(o.createOrder()).rejects.toThrow('No longer available');
    });
    expect(screen.getByRole('alert').textContent).toBe('No longer available: Theo.');
  });

  it('says so when the server answers strangely, or can’t be reached', async () => {
    const { o } = await drawn();
    fetchMock.mockResolvedValueOnce(json(200, { ok: true }));
    await act(async () => {
      await expect(o.createOrder()).rejects.toThrow(w.payError);
    });
    fetchMock.mockResolvedValueOnce(new Response('oops', { status: 500 }));
    await act(async () => {
      await expect(o.createOrder()).rejects.toThrow(w.payError);
    });
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await act(async () => {
      await expect(o.createOrder()).rejects.toThrow(w.errorNetwork);
    });
    expect(screen.getByRole('alert').textContent).toBe(w.errorNetwork);
  });

  it('won’t create a payment with the details gone', async () => {
    const { o } = await drawn(() => null);
    await expect(o.createOrder()).rejects.toThrow(w.payError);
  });

  it('shows the buyer what happened when taking the payment fails', async () => {
    const { o, onPaid } = await drawn();
    fetchMock.mockResolvedValueOnce(json(402, { error: 'PayPal didn’t complete the payment.' }));
    await act(() => o.onApprove({ orderID: 'PP1' }));
    expect(screen.getByRole('alert').textContent).toBe('PayPal didn’t complete the payment.');
    expect(onPaid).not.toHaveBeenCalled();
  });

  it('shows "finishing" while PayPal is taken', async () => {
    const { o } = await drawn();
    let finish: (r: Response) => void = () => undefined;
    fetchMock.mockReturnValueOnce(new Promise<Response>((r) => (finish = r)));
    let done: Promise<void> = Promise.resolve();
    act(() => {
      done = o.onApprove({ orderID: 'PP1' });
    });
    expect(await screen.findByRole('status')).toHaveProperty('textContent', w.paying);
    await act(async () => {
      finish(json(200, { ok: true, orderNumber: '1001' }));
      await done;
    });
  });

  it('says nothing was charged when the buyer closes PayPal, and on PayPal’s own errors', async () => {
    const { o } = await drawn();
    act(() => o.onCancel());
    expect(screen.getByRole('alert').textContent).toBe(w.payCancelled);
    act(() => o.onError(new Error('x')));
    expect(screen.getByRole('alert').textContent).toBe(w.payCancelled);
    act(() => {
      void o.onClick({}, actions());
    });
    act(() => o.onError(new Error('y')));
    expect(screen.getByRole('alert').textContent).toBe(w.payError);
  });

  it('loads PayPal’s script for her account and currency when it isn’t there yet', async () => {
    delete window.paypal;
    render(<PayPalButtons pay={pay} details={() => ({})} w={w} onPaid={vi.fn()} />);
    const script = document.head.querySelector('script');
    expect(script?.src).toContain('client-id=client');
    expect(script?.src).toContain('merchant-id=M1');
    expect(script?.src).toContain('currency=USD');
    installPayPal();
    act(() => script?.onload?.(new Event('load')));
    await waitFor(() => expect(opts).not.toBeNull());
  });

  it('says payment can’t load when PayPal’s script doesn’t', async () => {
    delete window.paypal;
    render(<PayPalButtons pay={pay} details={() => ({})} w={w} onPaid={vi.fn()} />);
    const script = document.head.querySelector('script');
    act(() => script?.onerror?.(new Event('error')));
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', w.payUnavailable);
  });

  it('says payment can’t load when the script loads without PayPal', async () => {
    delete window.paypal;
    render(<PayPalButtons pay={pay} details={() => ({})} w={w} onPaid={vi.fn()} />);
    act(() => document.head.querySelector('script')?.onload?.(new Event('load')));
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', w.payUnavailable);
  });

  it('closes PayPal’s buttons when it goes away', async () => {
    const { unmount } = await drawn();
    close.mockClear();
    unmount();
    expect(close).toHaveBeenCalled();
  });
});
