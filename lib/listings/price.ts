/**
 * Price parsing for maker-typed prices. A maker types "$24", "24", "24.50", even
 * "$1,200" — we parse to integer cents for `listings.base_price_cents`, or return
 * null when it isn't a real positive price so the caller can ask for one.
 */

/** Parse a maker-typed price into integer cents, or null when it isn't a positive
 *  number. Strips a leading currency symbol, thousands commas, and whitespace. */
export function parsePriceToCents(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, '');
  if (cleaned.length === 0) return null;
  const dollars = Number(cleaned);
  if (!Number.isFinite(dollars) || dollars <= 0) return null;
  return Math.round(dollars * 100);
}

/** Format integer cents to a display price ("$24", "$24.50"). Mirrors the storefront
 *  projection's `formatPrice` so a saved product reads back the same. */
export function formatCents(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}
