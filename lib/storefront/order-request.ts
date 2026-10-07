/**
 * An order request from the cart: what the shopper sends, and the email the maker
 * gets. Used while a shop takes orders without card payments — nothing is
 * charged; the maker answers by hand (an invoice, pickup or delivery). Every
 * price comes from the catalog, never from the shopper.
 */
import { z } from 'zod';
import type { ProductView } from '@/lib/archetypes/content';
import { CART_MAX } from './cart';
import { formatPrice } from './catalog';

export const orderRequestSchema = z.object({
  name: z.string().trim().min(1, 'Please enter your name.').max(120),
  email: z.string().trim().toLowerCase().email('That doesn’t look like a valid email.').max(254),
  phone: z.string().trim().max(40).default(''),
  note: z.string().trim().max(2000).default(''),
  listingIds: z.array(z.string().uuid()).min(1, 'Your cart is empty.').max(CART_MAX),
});

export type OrderRequestInput = z.infer<typeof orderRequestSchema>;

export type OrderLine = { listingId: string; name: string; priceCents: number };

export type LoadedPiece = { view: ProductView; priceCents: number; isPreview: boolean };

/**
 * The lines to order, in cart order, or the names of what can no longer be had
 * (adopted, taken down, or a piece with options the cart can't choose).
 */
export function orderLines(
  ids: readonly string[],
  loaded: readonly LoadedPiece[],
): { ok: true; lines: OrderLine[]; subtotalCents: number } | { ok: false; unavailable: string[] } {
  const byId = new Map(loaded.flatMap((p) => (p.view.id === undefined ? [] : [[p.view.id, p] as const])));
  const lines: OrderLine[] = [];
  const unavailable: string[] = [];
  for (const id of new Set(ids)) {
    const p = byId.get(id);
    if (p === undefined) {
      unavailable.push('A piece that is no longer listed');
      continue;
    }
    if (!isCartable(p)) {
      unavailable.push(p.view.name);
      continue;
    }
    lines.push({ listingId: id, name: p.view.name, priceCents: p.priceCents });
  }
  if (unavailable.length > 0) return { ok: false, unavailable };
  return { ok: true, lines, subtotalCents: lines.reduce((sum, l) => sum + l.priceCents, 0) };
}

/** A piece the cart can take: live, in stock, a real listing, no options to pick. */
export function isCartable(p: LoadedPiece): boolean {
  return p.view.status === 'active' && !p.isPreview && p.view.variations.length === 0 && p.priceCents > 0;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** The email to the maker for a new request. */
export function orderRequestEmail(args: {
  shopName: string;
  orderNumber: string;
  input: OrderRequestInput;
  lines: readonly OrderLine[];
  subtotalCents: number;
}): { subject: string; text: string; html: string } {
  const { shopName, orderNumber, input, lines, subtotalCents } = args;
  const subject = `New order request #${orderNumber} from ${input.name} via ${shopName}`;
  const contact = [input.email, input.phone].filter((s) => s !== '').join(' · ');
  const text = [
    `Order request #${orderNumber}`,
    '',
    ...lines.map((l) => `- ${l.name}: ${formatPrice(l.priceCents)}`),
    `Total: ${formatPrice(subtotalCents)}`,
    '',
    `From: ${input.name} (${contact})`,
    ...(input.note === '' ? [] : ['', 'Their note:', input.note]),
    '',
    'Nothing has been charged. Reply to this email to arrange payment and how they get it.',
  ].join('\n');
  const html = `
    <p><strong>Order request #${escapeHtml(orderNumber)}</strong></p>
    <ul>${lines.map((l) => `<li>${escapeHtml(l.name)}: ${escapeHtml(formatPrice(l.priceCents))}</li>`).join('')}</ul>
    <p><strong>Total:</strong> ${escapeHtml(formatPrice(subtotalCents))}</p>
    <p><strong>From:</strong> ${escapeHtml(input.name)} (${escapeHtml(contact)})</p>
    ${input.note === '' ? '' : `<p><strong>Their note:</strong><br />${escapeHtml(input.note).replace(/\n/g, '<br />')}</p>`}
    <hr />
    <p>Nothing has been charged. Reply to this email to arrange payment and how they get it.</p>
  `;
  return { subject, text, html };
}
