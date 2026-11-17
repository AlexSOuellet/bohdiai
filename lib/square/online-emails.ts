/**
 * The maker's emails about the online shop's Square payments, in the approved look
 * (renderEmail): a paid order, and a piece that had already sold, so the shopper
 * was given their money back. Both sit with the samples on the admin's Emails tab.
 */
import { renderEmail } from '@/lib/email/layout';
import { formatPrice } from '@/lib/storefront/catalog';

export type PaidOrderFacts = {
  shopName: string;
  orderNumber: string;
  name: string;
  email: string;
  phone: string;
  note: string;
  lines: readonly { name: string; cents: number }[];
  discount: { label: string; cents: number } | null;
  totalCents: number;
  /** The maker's Orders screen. */
  ordersUrl: string;
};

type Mail = { subject: string; html: string; text: string };

function itemLines(f: PaidOrderFacts): string[] {
  return [
    ...f.lines.map((l) => `${l.name}: ${formatPrice(l.cents)}`),
    ...(f.discount === null ? [] : [`${f.discount.label}: −${formatPrice(f.discount.cents)}`]),
    `Total: ${formatPrice(f.totalCents)}`,
  ];
}

function from(f: PaidOrderFacts): string {
  return `From ${f.name}, ${[f.email, f.phone].filter((s) => s !== '').join(', ')}.`;
}

function mail(subject: string, heading: string, paragraphs: string[], f: PaidOrderFacts, assetBase?: string): Mail {
  const button = { label: 'See your orders', url: f.ordersUrl };
  return {
    subject,
    html: renderEmail({ heading, paragraphs, button, assetBase }),
    text: [heading, '', ...paragraphs, '', `${button.label}: ${button.url}`].join('\n'),
  };
}

/** A shopper paid for an order on the maker's site, through the maker's Square. */
export function paidOrderEmail(f: PaidOrderFacts, assetBase?: string): Mail {
  return mail(
    `Paid order ${f.orderNumber} on ${f.shopName}`,
    `Paid order ${f.orderNumber}`,
    [
      ...itemLines(f),
      from(f),
      ...(f.note === '' ? [] : [`Their note: ${f.note}`]),
      'Paid in full by card, and the money is in your Square. Reply to this email to arrange how they get it.',
    ],
    f,
    assetBase,
  );
}

/** Two shoppers paid for the same piece at once; this one was too late, so Square
 *  gave their money back on its own. */
export function soldTwiceEmail(f: PaidOrderFacts, assetBase?: string): Mail {
  return mail(
    `Order ${f.orderNumber} was refunded: it had already sold`,
    'Something sold twice',
    [
      `Two shoppers paid for the same piece at the same moment. ${f.name} was second, so the piece had already sold by the time their payment went through.`,
      `Their ${formatPrice(f.totalCents)} was given back to their card through your Square straight away, and order ${f.orderNumber} shows as refunded in Orders. Nothing else needs doing.`,
      ...itemLines(f),
      from(f),
      'If you can make another one, they might like to hear from you. Reply to this email to reach them.',
    ],
    f,
    assetBase,
  );
}
