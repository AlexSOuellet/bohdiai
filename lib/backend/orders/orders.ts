/**
 * Orders as the backend shows them, and the steps an owner can move one through.
 * Shared by the Orders screen and its actions; no database access here.
 */
export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'canceled';

export const ORDER_STATUSES: readonly OrderStatus[] = ['pending', 'paid', 'fulfilled', 'canceled'];

export const STATUS_LABEL: Readonly<Record<OrderStatus, string>> = {
  pending: 'New',
  paid: 'Paid',
  fulfilled: 'Handed over',
  canceled: 'Canceled',
};

export function isOrderStatus(v: unknown): v is OrderStatus {
  return (ORDER_STATUSES as readonly unknown[]).includes(v);
}

/** What the owner can move an order to next, with the button words. */
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
        { to: 'canceled', label: 'Cancel' },
      ];
    case 'fulfilled':
      return [{ to: 'paid', label: 'Undo handed over' }];
    case 'canceled':
      return [{ to: 'pending', label: 'Reopen' }];
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
  /** Money off and what gave it (a code, or the sale's name); absent when none. */
  discount?: { label: string; amount: string } | undefined;
  items: { name: string; price: string }[];
};
