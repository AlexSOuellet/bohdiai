/**
 * A site's words (Alex, 2026-10-14: nothing is ever written into the code). Every
 * word a design shows lives in `site_words`, one row per spot. A design describes
 * its spots as a shape — the same nesting as its words, with every leaf blank —
 * and reads the site's words into that shape. The code names spots; it never
 * holds a word.
 *
 * A word with a blank in it names the blank: "Open photo: {caption}". `fill`
 * puts the value in.
 */

/** A design's spots: nested names, every leaf blank. */
export type WordShape = { readonly [name: string]: '' | WordShape };

/** The words for a shape: every blank leaf becomes that site's text. */
export type Words<S> = { readonly [K in keyof S]: S[K] extends string ? string : Words<S[K]> };

/** Every spot in a shape as a full key: "card.form.send". */
export function wordKeys(shape: WordShape, prefix: string): string[] {
  return Object.entries(shape).flatMap(([name, leaf]) => {
    const key = `${prefix}.${name}`;
    return typeof leaf === 'string' ? [key] : wordKeys(leaf, key);
  });
}

/** The site's words laid into the shape. A spot the site has no word for is blank,
 *  never a made-up default; `missing` lists them so the loader can say so. */
export function wordsFrom<S extends WordShape>(shape: S, prefix: string, rows: ReadonlyMap<string, string>, missing: string[] = []): Words<S> {
  const out: Record<string, unknown> = {};
  for (const [name, leaf] of Object.entries(shape)) {
    const key = `${prefix}.${name}`;
    if (typeof leaf === 'string') {
      const text = rows.get(key);
      if (text === undefined) missing.push(key);
      out[name] = text ?? '';
    } else out[name] = wordsFrom(leaf, key, rows, missing);
  }
  return out as Words<S>;
}

/** Puts values into a word's named blanks: fill("Order {n}", { n: '12' }). A blank
 *  with no value is left as it is, so a mistake shows instead of hiding. */
export function fill(text: string, values: Readonly<Record<string, string | number>>): string {
  return text.replace(/\{([A-Za-z0-9]+)\}/g, (whole, name: string) => {
    const v = values[name];
    return v === undefined ? whole : String(v);
  });
}

/** Words for tests: each spot says its own key, so a test can find exactly which
 *  spot a component painted without any real words living in the code. */
export function keyWords<S extends WordShape>(shape: S, prefix: string): Words<S> {
  return wordsFrom(shape, prefix, new Map(wordKeys(shape, prefix).map((k) => [k, k])));
}
