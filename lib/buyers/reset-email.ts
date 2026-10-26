/**
 * A buyer's password-reset email, in the shop's own words. The link goes to the
 * shop's own /account/reset, which shows the new-password form; the token is
 * only spent when the buyer sends that form (an email scanner opening the link
 * can't use it up).
 */
import { fill } from '@/lib/site-words/words';

export type ResetEmailWords = { subject: string; lead: string; action: string; expiry: string };

export function buyerResetLink(shopOrigin: string, hashedToken: string): string {
  const u = new URL('/account/reset', shopOrigin);
  u.searchParams.set('token_hash', hashedToken);
  return u.toString();
}

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function buyerResetEmail(w: ResetEmailWords, shopName: string, link: string): { subject: string; text: string; html: string } {
  const subject = fill(w.subject, { shop: shopName });
  const lead = fill(w.lead, { shop: shopName });
  const text = `${lead}\n\n${w.action}: ${link}\n\n${w.expiry}\n\n${shopName}`;
  const html = `<p>${escapeHtml(lead)}</p><p><a href="${escapeHtml(link)}">${escapeHtml(w.action)}</a></p><p>${escapeHtml(w.expiry)}</p><p>${escapeHtml(shopName)}</p>`;
  return { subject, text, html };
}
