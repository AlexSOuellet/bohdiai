/**
 * Orders as the backend shows them, and the steps an owner can move one through.
 * Shared by the Orders screen and its actions; no database access here.
 */
export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'canceled' | 'refunded';

export const ORDER_STATUSES: readonly OrderStatus[] = ['pending', 'paid', 'fulfilled', 'canceled', 'refunded'];

export const STATUS_LABEL: Readonly<Record<OrderStatus, string>> = {
  pending: 'New',
  paid: 'Paid',
  fulfilled: 'Handed over',
  canceled: 'Canceled',
  refunded: 'Refunded',
};

export function isOrderStatus(v: unknown): v is OrderStatus {
  return (ORDER_STATUSES as readonly unknown[]).includes(v);
}

/** What the owner can move an order to next, with the button words. A paid order is
 *  refunded, never canceled (Alex, 2026-10-21: Refund on every paid sale); a refund is
 *  final. */
export function nextSteps(status: OrderStatus): { to: OrderStatus; label: string }[] {
  switch (status) {
    case 'pending':
      return [
        { to: 'paid', label: 'Mark paid' },
        { to: 'canceled', label: 'Cancel' },
      ];
    case 'paid':
      return [
        { to: 'fulfilled', label: 'Mark handed over' },
        { to: 'refunded', label: 'Refund' },
      ];
    case 'fulfilled':
      return [
        { to: 'paid', label: 'Undo handed over' },
        { to: 'refunded', label: 'Refund' },
      ];
    case 'canceled':
      return [{ to: 'pending', label: 'Reopen' }];
    case 'refunded':
      return [];
  }
}

export type OrderRow = {
  id: string;
  number: string;
  createdAt: string;
  status: OrderStatus;
  name: string;
  email: string;
  phone: string;
  note: string;
  total: string;
  /** "At the market · Venmo" for a market sale; absent for an online order. */
  via?: string | undefined;
  /** Money off and what gave it (a code, or the sale's name); absent when none. */
  discount?: { label: string; amount: string } | undefined;
  items: { name: string; price: string }[];
};
