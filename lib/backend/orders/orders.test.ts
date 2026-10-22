import { describe, it, expect } from 'vitest';
import { isOrderStatus, nextSteps } from './orders';
import { ordersHomeData } from './home';

describe('nextSteps', () => {
  it('moves a new order to paid or canceled, a paid one to handed over or refunded', () => {
    expect(nextSteps('pending').map((s) => s.to)).toEqual(['paid', 'canceled']);
    expect(nextSteps('paid').map((s) => s.to)).toEqual(['fulfilled', 'refunded']);
    expect(nextSteps('fulfilled').map((s) => s.to)).toEqual(['paid', 'refunded']);
    expect(nextSteps('canceled').map((s) => s.to)).toEqual(['pending']);
  });
  it('a refund is final', () => {
    expect(nextSteps('refunded')).toEqual([]);
  });
  it('knows its statuses', () => {
    expect(isOrderStatus('paid')).toBe(true);
    expect(isOrderStatus('refunded')).toBe(true);
    expect(isOrderStatus('shipped')).toBe(false);
  });
});

describe('ordersHomeData', () => {
  it('flags waiting orders', () => {
    expect(ordersHomeData(0)).toEqual({ tiles: [{ label: 'New orders', value: '0', note: 'waiting on you' }], attention: [] });
    expect(ordersHomeData(1).attention).toEqual(['One new order is waiting. Open Orders to answer it.']);
    expect(ordersHomeData(3).attention[0]).toContain('3 new orders');
  });
});
