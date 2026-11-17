import { describe, it, expect, vi } from 'vitest';
import { createPaymentLink, findPayment, findSale, refundPayment, SquareError } from './api';

const config = { applicationId: 'app-id', applicationSecret: 'app-secret', tokenKey: 'k', sandbox: false };

function answer(status: number, body: unknown): typeof fetch {
  return vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
}

describe('the online shop’s calls to Square', () => {
  const order = { referenceId: 'ours', locationId: 'L1', currency: 'USD', lines: [{ name: 'Bowl', cents: 500 }], discount: null, redirectUrl: 'https://s/cart', buyerEmail: '', note: 'n' };

  it('reads back the checkout page, its order and Square’s total', async () => {
    const link = await createPaymentLink(config, 'A', order, answer(200, { payment_link: { url: 'https://square.link/u/1', order_id: 'O' }, related_resources: { orders: [{ id: 'O', total_money: { amount: 500, currency: 'USD' } }] } }));
    expect(link).toEqual({ url: 'https://square.link/u/1', orderId: 'O', totalCents: 500, currency: 'USD' });
    expect((await createPaymentLink(config, 'A', order, answer(200, { payment_link: { url: 'u', order_id: 'O' } }))).totalCents).toBe(-1);
    await expect(createPaymentLink(config, 'A', order, answer(200, { payment_link: { url: 'u' } }))).rejects.toThrow('incomplete');
    await expect(createPaymentLink(config, 'A', order, answer(401, { errors: [{ code: 'INSUFFICIENT_SCOPES' }] }))).rejects.toThrow('INSUFFICIENT_SCOPES');
  });

  it('reads one payment, and none when Square has no such payment', async () => {
    const p = await findPayment(config, 'A', 'P1', answer(200, { payment: { id: 'P1', status: 'COMPLETED', amount_money: { amount: 500, currency: 'USD' }, order_id: 'O', location_id: 'L1' } }));
    expect(p).toEqual({ id: 'P1', status: 'COMPLETED', amountCents: 500, currency: 'USD', orderId: 'O', locationId: 'L1' });
    expect(await findPayment(config, 'A', 'P1', answer(200, { payment: { id: 'P1' } }))).toEqual({ id: 'P1', status: '', amountCents: 0, currency: '', orderId: '', locationId: '' });
    expect(await findPayment(config, 'A', 'P1', answer(200, {}))).toBeNull();
    expect(await findPayment(config, 'A', 'NOPE', answer(404, {}))).toBeNull();
    await expect(findPayment(config, 'A', 'P1', answer(500, {}))).rejects.toThrow(SquareError);
  });

  it('gives a payment back once, with a key Square accepts', async () => {
    const fetcher = answer(200, { refund: { id: 'R1', status: 'PENDING' } });
    expect(await refundPayment(config, 'A', { paymentId: 'P1', cents: 500, currency: 'USD', key: 'k'.repeat(60), reason: 'r' }, fetcher)).toBe('R1');
    const [url, init] = (fetcher as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0] ?? [];
    expect(url).toBe('https://connect.squareup.com/v2/refunds');
    expect(JSON.parse(String(init?.body))).toMatchObject({ idempotency_key: 'k'.repeat(45), payment_id: 'P1', amount_money: { amount: 500, currency: 'USD' } });
    await expect(refundPayment(config, 'A', { paymentId: 'P1', cents: 500, currency: 'USD', key: 'k', reason: 'r' }, answer(200, { refund: { id: 'R1', status: 'FAILED' } }))).rejects.toThrow('refused');
    await expect(refundPayment(config, 'A', { paymentId: 'P1', cents: 500, currency: 'USD', key: 'k', reason: 'r' }, answer(200, {}))).rejects.toThrow('refused');
  });

  it('reads a checkout order’s reference and what’s still owed', async () => {
    const sale = await findSale(config, 'A', 'O', answer(200, { order: { id: 'O', location_id: 'L1', reference_id: 'ours', total_money: { amount: 500, currency: 'USD' }, net_amount_due_money: { amount: 0 } } }));
    expect(sale).toMatchObject({ referenceId: 'ours', dueCents: 0, payments: [] });
    expect(await findSale(config, 'A', 'O', answer(200, { order: { id: 'O' } }))).toBeNull();
  });
});
