/** Web addresses for products and collections (plan 1b decision 10). */
const MAX_SLUG = 60;

export function slugify(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG)
    .replace(/-+$/, '');
  return slug === '' ? 'item' : slug;
}

export function uniqueSlug(base: string, taken: ReadonlySet<string>): string {
  const lower = new Set([...taken].map((t) => t.toLowerCase()));
  if (!lower.has(base)) return base;
  for (let n = 2; ; n++) if (!lower.has(`${base}-${n}`)) return `${base}-${n}`;
}
