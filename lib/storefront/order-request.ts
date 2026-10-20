/**
 * An order request from the cart: what the shopper sends, and the email the maker
 * gets. Used while a shop takes orders without card payments — nothing is
 * charged; the maker answers by hand (an invoice, pickup or delivery). Every
 * price comes from the catalog, never from the shopper.
 */
import { hasPrice } from '@/lib/catalog/price';
import { z } from 'zod';
import type { ProductView } from '@/lib/archetypes/content';
import { CART_MAX, isCartEntry, splitEntry } from './cart';
import { formatPrice } from './catalog';

export const orderRequestSchema = z.object({
  name: z.string().trim().min(1, 'Please enter your name.').max(120),
  email: z.string().trim().toLowerCase().email('That doesn’t look like a valid email.').max(254),
  phone: z.string().trim().max(40).default(''),
  note: z.string().trim().max(2000).default(''),
  /** The cart's entries: a piece's id, or a piece's id and its chosen combination's (see cart.ts). */
  listingIds: z.array(z.string().refine(isCartEntry, 'Your cart has something it can’t read. Take it out and add it again.')).min(1, 'Your cart is empty.').max(CART_MAX),
  /** The discount code the cart applied, or ''. */
  code: z.string().trim().max(40).default(''),
});

export type OrderRequestInput = z.infer<typeof orderRequestSchema>;

/** One line of an order: the piece, its chosen combination (and that choice in words), the price. */
export type OrderLine = { listingId: string; variantId: string | null; name: string; option: string | null; priceCents: number };

export type LoadedPiece = { view: ProductView; priceCents: number; isPreview: boolean };

/** A combination's choices in words: "Blue / Large", in the piece's option order. */
export function choiceWords(p: LoadedPiece, choices: Record<string, string>): string {
  return p.view.variations.flatMap((v) => (choices[v.name] === undefined || choices[v.name] === '' ? [] : [choices[v.name] as string])).join(' / ');
}

/** What one cart entry is: its line when it can be had, else null. A piece without
 *  options is its own line; a piece with options needs a live, in-stock choice. */
export function cartLine(entry: string, loaded: readonly LoadedPiece[]): OrderLine | null {
  const { listingId, variantId } = splitEntry(entry);
  const p = loaded.find((x) => x.view.id === listingId);
  if (p === undefined || p.view.status !== 'active' || p.isPreview) return null;
  if (p.view.variations.length === 0) {
    if (variantId !== null || !hasPrice(p.priceCents)) return null;
    return { listingId, variantId: null, name: p.view.name, option: null, priceCents: p.priceCents };
  }
  const offer = variantId === null ? undefined : (p.view.offers ?? []).find((o) => o.id === variantId);
  if (offer === undefined || offer.soldOut || offer.priceCents === undefined || !hasPrice(offer.priceCents)) return null;
  const option = choiceWords(p, offer.choices);
  return { listingId, variantId, name: option === '' ? p.view.name : `${p.view.name}, ${option}`, option, priceCents: offer.priceCents };
}

/**
 * The lines to order, in cart order, or the names of what can no longer be had
 * (adopted, taken down, or a choice that's gone).
 */
export function orderLines(
  entries: readonly string[],
  loaded: readonly LoadedPiece[],
): { ok: true; lines: OrderLine[]; subtotalCents: number } | { ok: false; unavailable: string[] } {
  const lines: OrderLine[] = [];
  const unavailable: string[] = [];
  for (const entry of new Set(entries)) {
    const line = cartLine(entry, loaded);
    if (line !== null) {
      lines.push(line);
      continue;
    }
    const p = loaded.find((x) => x.view.id === splitEntry(entry).listingId);
    unavailable.push(p === undefined ? 'A piece that is no longer listed' : p.view.name);
  }
  if (unavailable.length > 0) return { ok: false, unavailable };
  return { ok: true, lines, subtotalCents: lines.reduce((sum, l) => sum + l.priceCents, 0) };
}

/** A piece the cart can take as it is: live, in stock, a real listing, no options to pick. */
export function isCartable(p: LoadedPiece): boolean {
  return p.view.status === 'active' && !p.isPreview && p.view.variations.length === 0 && hasPrice(p.priceCents);
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
  discount?: { label: string; cents: number } | null;
}): { subject: string; text: string; html: string } {
  const { shopName, orderNumber, input, lines, subtotalCents } = args;
  const off = args.discount ?? null;
  const totalCents = subtotalCents - (off?.cents ?? 0);
  const subject = `New order request #${orderNumber} from ${input.name} via ${shopName}`;
  const contact = [input.email, input.phone].filter((s) => s !== '').join(' · ');
  const text = [
    `Order request #${orderNumber}`,
    '',
    ...lines.map((l) => `- ${l.name}: ${formatPrice(l.priceCents)}`),
    ...(off === null ? [] : [`Discount (${off.label}): -${formatPrice(off.cents)}`]),
    `Total: ${formatPrice(totalCents)}`,
    '',
    `From: ${input.name} (${contact})`,
    ...(input.note === '' ? [] : ['', 'Their note:', input.note]),
    '',
    'Nothing has been charged. Reply to this email to arrange payment and how they get it.',
  ].join('\n');
  const html = `
    <p><strong>Order request #${escapeHtml(orderNumber)}</strong></p>
    <ul>${lines.map((l) => `<li>${escapeHtml(l.name)}: ${escapeHtml(formatPrice(l.priceCents))}</li>`).join('')}</ul>
    ${off === null ? '' : `<p>Discount (${escapeHtml(off.label)}): -${escapeHtml(formatPrice(off.cents))}</p>`}
    <p><strong>Total:</strong> ${escapeHtml(formatPrice(totalCents))}</p>
    <p><strong>From:</strong> ${escapeHtml(input.name)} (${escapeHtml(contact)})</p>
    ${input.note === '' ? '' : `<p><strong>Their note:</strong><br />${escapeHtml(input.note).replace(/\n/g, '<br />')}</p>`}
    <hr />
    <p>Nothing has been charged. Reply to this email to arrange payment and how they get it.</p>
  `;
  return { subject, text, html };
}
