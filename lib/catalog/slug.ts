/** Web addresses for products and collections (plan 1b decision 10). */
const MAX_SLUG = 60;

/** Letters that don't decompose into a base letter plus an accent, spelled out. */
const SPELLED: Readonly<Record<string, string>> = {
  ø: 'o', Ø: 'o', æ: 'ae', Æ: 'ae', œ: 'oe', Œ: 'oe', ß: 'ss',
  ł: 'l', Ł: 'l', đ: 'd', Đ: 'd', þ: 'th', Þ: 'th', ð: 'd', Ð: 'd',
};
const SPELLED_RE = new RegExp(`[${Object.keys(SPELLED).join('')}]`, 'g');

/** Cut to `max` characters without leaving a trailing hyphen. */
const cap = (slug: string, max: number): string => slug.slice(0, max).replace(/-+$/, '');

export function slugify(name: string): string {
  const slug = cap(
    name
      .replace(SPELLED_RE, (ch) => SPELLED[ch] ?? ch)
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, ''),
    MAX_SLUG,
  );
  return slug === '' ? 'item' : slug;
}

/** `base` (lowercased), or `base-N` with the first free N — never longer than 60 characters. */
export function uniqueSlug(base: string, taken: ReadonlySet<string>): string {
  const lower = new Set([...taken].map((t) => t.toLowerCase()));
  const first = cap(base.toLowerCase(), MAX_SLUG);
  if (!lower.has(first)) return first;
  for (let n = 2; ; n++) {
    const suffix = `-${n}`;
    const candidate = cap(first, MAX_SLUG - suffix.length) + suffix;
    if (!lower.has(candidate)) return candidate;
  }
}

/**
 * What every address uniqueSlug(base, …) can return starts with — the base cut
 * short enough for a `-N` of up to seven digits. Look up taken addresses by this,
 * or a numbered long address (its base trimmed to fit) is missed.
 */
export function slugLookupPrefix(base: string): string {
  return base.toLowerCase().slice(0, MAX_SLUG - 8);
}
