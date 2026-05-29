// Punctuation sanitizer. AI text generation defaults to em-dash-heavy,
// semicolon-heavy, parenthetical-heavy prose — a recognizable AI cadence
// that reads as sloppy on a maker's storefront. Telling the model not to
// use them doesn't hold (the model rationalizes past the instruction). The
// sanitizer is the floor: a post-process pass over every text field at
// finalize time so the model can't keep its bad habits in the output.

/**
 * Strip the AI-tell punctuation marks: em-dash, en-dash, semicolon, and
 * obviously-aside parentheticals. Replacements aim to keep the sentence
 * readable rather than perfect.
 */
export function sanitizeCopy(text: string): string {
  if (text === '') return text;

  let out = text;

  // Em-dash and en-dash → period + space. Captures both " — " (typographic
  // with spaces) and "—" (tight, often in compound asides). The result
  // becomes two sentences instead of a parenthetical aside, which is the
  // cleaner cadence anyway.
  out = out.replace(/\s*[—–]\s*/g, '. ');

  // Semicolon → period + space.
  out = out.replace(/\s*;\s*/g, '. ');

  // Parenthetical asides — `(like this)` reads as scripted. Strip the
  // parens and let the content flow. Only handle parentheses on a single
  // line; nested or multiline cases are unusual in generated copy.
  out = out.replace(/\s*\(([^()]*)\)/g, ' $1');

  // Collapse any double-spaces the replacements created.
  out = out.replace(/[ \t]+/g, ' ');

  // After replacing em-dash with ". ", the next word is often lowercase.
  // Re-capitalize the first letter after a period+space.
  out = out.replace(/\. ([a-z])/g, (_m, c: string) => `. ${c.toUpperCase()}`);

  return out.trim();
}

/**
 * Recursively walk an object (or array, or primitive) and apply
 * sanitizeCopy to every string value. Returns a new object — does not
 * mutate the input. Used at finalize time to scrub everything Bohdi has
 * accumulated before the storefront writes.
 */
export function sanitizeDeep<T>(value: T): T {
  if (typeof value === 'string') return sanitizeCopy(value) as T;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeDeep(item)) as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = sanitizeDeep(v);
    }
    return out as T;
  }
  return value;
}
