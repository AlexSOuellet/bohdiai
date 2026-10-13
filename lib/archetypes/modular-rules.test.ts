/**
 * Modular rules (Modular Plan, step 1.3; Alex 2026-10-13). Three checks that
 * stop a design from drifting back to storing or inventing content:
 *
 * 1. A design reads page-record content only where the register still lists it.
 * 2. Every word in a design's strings file is sorted into site or platform.
 * 3. No words are typed straight into a design or shop page.
 *
 * Each list in the register can only shrink. A new offender fails; so does a
 * listed offender that has been fixed, so the list is kept honest.
 */
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { CARD_STRINGS } from './card/strings';
import { CardContentSchema } from './card/design';
import { NURSERY_STRINGS } from './boutique/strings';
import { BoutiqueContentSchema } from './boutique/design';
import { CONTRACTOR_STRINGS } from './contractor/strings';
import { ContractorContentSchema } from './contractor/schemas';
import { DEFAULT_COUNTS, DEFAULT_STRINGS, REFERENCE_LABELS } from './main-street/defaults';
import { MainStreetContentSchema } from './main-street/schemas';
import { PAGE_RECORD_READS, TYPED_IN_WORDS, WORD_REGISTER } from './modular-rules.register';

const ROOT = path.resolve(__dirname, '..', '..');

/** The keys a content schema accepts, unwrapping refinements. */
function schemaKeys(schema: z.ZodTypeAny): string[] {
  let s: z.ZodTypeAny = schema;
  while (s instanceof z.ZodEffects) s = s.innerType();
  if (!(s instanceof z.ZodObject)) throw new Error('content schema is not an object');
  return Object.keys(s.shape as Record<string, unknown>);
}

/** Every leaf key path in a strings object ("form.send", "calendar.weekdays.0"). */
function leafPaths(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object') return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) => leafPaths(v, prefix === '' ? k : `${prefix}.${k}`));
}

function matches(pattern: string, key: string): boolean {
  return pattern.endsWith('.*') ? key.startsWith(pattern.slice(0, -1)) : pattern === key;
}

describe('modular rules: page records hold settings only', () => {
  const designs: Record<string, z.ZodTypeAny> = {
    boutique: BoutiqueContentSchema,
    card: CardContentSchema,
    contractor: ContractorContentSchema,
    'main-street': MainStreetContentSchema,
  };

  it('covers every design that has a content schema', () => {
    expect(Object.keys(PAGE_RECORD_READS).sort()).toEqual(Object.keys(designs).sort());
  });

  for (const [design, schema] of Object.entries(designs)) {
    it(`${design} reads only the page-record content still listed (and the list is current)`, () => {
      const reads = schemaKeys(schema).filter((k) => k !== 'design').sort();
      // A new key here means a design started keeping content in the page record:
      // give it a home instead. A key that's gone means it moved: take it off the list.
      expect(reads).toEqual([...(PAGE_RECORD_READS[design] ?? [])].sort());
    });
  }
});

describe('modular rules: every design word is sorted into site or platform', () => {
  const files: Record<string, unknown> = {
    'card/CARD_STRINGS': CARD_STRINGS,
    'boutique/NURSERY_STRINGS': NURSERY_STRINGS,
    'contractor/CONTRACTOR_STRINGS': CONTRACTOR_STRINGS,
    'main-street/DEFAULT_STRINGS': DEFAULT_STRINGS,
    'main-street/REFERENCE_LABELS': REFERENCE_LABELS,
    'main-street/DEFAULT_COUNTS': DEFAULT_COUNTS,
  };

  it('covers every strings file', () => {
    expect(Object.keys(WORD_REGISTER).sort()).toEqual(Object.keys(files).sort());
  });

  for (const [name, strings] of Object.entries(files)) {
    const register = WORD_REGISTER[name];
    if (register === undefined) continue;
    const keys = leafPaths(strings);

    it(`${name}: each word is sorted into exactly one kind`, () => {
      const unsorted = keys.filter((k) => ![...register.site, ...register.platform].some((p) => matches(p, k)));
      const both = keys.filter((k) => register.site.some((p) => matches(p, k)) && register.platform.some((p) => matches(p, k)));
      // Unsorted: a new word. Decide whether it's the site's (it needs a home) or
      // the platform's, and add it to the register.
      expect(unsorted).toEqual([]);
      expect(both).toEqual([]);
    });

    it(`${name}: the register lists no word that's gone`, () => {
      const stale = [...register.site, ...register.platform].filter((p) => !keys.some((k) => matches(p, k)));
      // Stale: the word moved to its home or was removed. Take it off the list.
      expect(stale).toEqual([]);
    });
  }
});

describe('modular rules: no words typed straight into designs or shop pages', () => {
  /** Attributes whose value is read by a person (on screen or by a screen reader). */
  const TEXT_ATTRS = new Set(['aria-label', 'aria-description', 'aria-roledescription', 'aria-valuetext', 'alt', 'title', 'placeholder', 'label']);
  /** An HTML entity on its own (an arrow, a dash, ©) is a symbol, not a word. */
  const ENTITY_ONLY = /^(\s*&[a-z]+;\s*)+$/;
  /** Icon-font names (arrow_back) are drawn as icons, not read as words. */
  const ICON_NAME = /^[a-z]+(_[a-z]+)+$/;

  function sourceFiles(dir: string): string[] {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) return [];
    return fs.readdirSync(abs, { withFileTypes: true }).flatMap((e) => {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) return sourceFiles(rel);
      return e.name.endsWith('.tsx') && !e.name.includes('.test.') ? [rel] : [];
    });
  }

  function typedInWords(rel: string): string[] {
    const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const sf = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const found: string[] = [];
    const isWord = (s: string) => /[A-Za-z]/.test(s) && !ENTITY_ONLY.test(s) && !ICON_NAME.test(s.trim());
    const clean = (s: string) => s.replace(/&[a-z]+;/g, (e) => (e === '&apos;' ? '’' : '')).replace(/\s+/g, ' ').trim();
    const visit = (node: ts.Node): void => {
      if (ts.isJsxText(node) && isWord(node.text)) found.push(clean(node.text));
      if (ts.isJsxAttribute(node) && TEXT_ATTRS.has(node.name.getText(sf))) {
        const init = node.initializer;
        if (init !== undefined && ts.isStringLiteral(init) && isWord(init.text)) found.push(clean(init.text));
      }
      if (ts.isJsxExpression(node) && node.expression !== undefined && !ts.isJsxAttribute(node.parent)) {
        const e = node.expression;
        if ((ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) && isWord(e.text) && /[A-Za-z]{2}/.test(e.text)) found.push(clean(e.text));
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
    return found.filter((s) => s !== '');
  }

  const files = [...sourceFiles('lib/archetypes'), ...sourceFiles('lib/storefront'), ...sourceFiles('app/storefront')];

  it('finds the files it is meant to scan', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it('every typed-in word is a known offender, and every listed offender is still there', () => {
    const actual: Record<string, string[]> = {};
    for (const rel of files) {
      const words = typedInWords(rel);
      if (words.length > 0) actual[rel] = [...new Set(words)].sort();
    }
    const expected = Object.fromEntries(Object.entries(TYPED_IN_WORDS).map(([f, w]) => [f, [...w].sort()]));
    // A new entry: put the words in the strings file (platform) or the site's
    // content (site). A missing one: it was fixed, take it off the list.
    expect(actual).toEqual(expected);
  });
});
