import { PRIVACY_TEMPLATE } from '@/content/legal/privacy';
import { TERMS_TEMPLATE } from '@/content/legal/terms';

export type LegalDoc = 'terms' | 'privacy';

export interface LegalContext {
  shopName: string;
  contactEmail: string;
  /** ISO date string (YYYY-MM-DD). The "Last updated" line in the rendered doc. */
  lastUpdated: string;
}

/**
 * Fills a legal template from /content/legal with the shop's details
 * ({{shopName}}, {{contactEmail}}, {{lastUpdated}}). The templates are bundled
 * modules, not files read at request time: shop pages render on Cloudflare
 * Workers, which have no filesystem.
 */
const TEMPLATES: Readonly<Record<LegalDoc, string>> = {
  privacy: PRIVACY_TEMPLATE,
  terms: TERMS_TEMPLATE,
};

export function loadLegalMarkdown(doc: LegalDoc, ctx: LegalContext): string {
  return TEMPLATES[doc]
    .replace(/\{\{shopName\}\}/g, escapeHtml(ctx.shopName))
    .replace(/\{\{contactEmail\}\}/g, escapeHtml(ctx.contactEmail))
    .replace(/\{\{lastUpdated\}\}/g, escapeHtml(ctx.lastUpdated));
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Renders the small, controlled subset of markdown used in legal templates:
 *   # h1, ## h2, paragraphs, _em_, **strong**, [link](url).
 *
 * Not a general-purpose markdown renderer. If templates grow beyond these
 * primitives, switch to a library (e.g. marked).
 */
export function renderLegalHtml(markdown: string): string {
  const lines = markdown.split('\n');
  const out: string[] = [];

  const flushParagraph = (buffer: string[]): void => {
    if (buffer.length === 0) return;
    const text = buffer.join(' ').trim();
    if (text !== '') out.push(`<p>${renderInline(text)}</p>`);
    buffer.length = 0;
  };

  const paraBuffer: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line === '') {
      flushParagraph(paraBuffer);
      continue;
    }

    const h1 = /^#\s+(.*)$/.exec(line);
    if (h1 !== null) {
      flushParagraph(paraBuffer);
      out.push(`<h1>${renderInline(h1[1] ?? '')}</h1>`);
      continue;
    }

    const h2 = /^##\s+(.*)$/.exec(line);
    if (h2 !== null) {
      flushParagraph(paraBuffer);
      out.push(`<h2>${renderInline(h2[1] ?? '')}</h2>`);
      continue;
    }

    paraBuffer.push(line);
  }
  flushParagraph(paraBuffer);

  return out.join('\n');
}

function renderInline(text: string): string {
  let html = text;

  // Links: [label](url) — url must be http(s) or mailto to prevent javascript: injection.
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g,
    (_match, label: string, url: string) => {
      const safeLabel = label;
      const isExternal = url.startsWith('http');
      const rel = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${url}"${rel}>${safeLabel}</a>`;
    },
  );

  // Bold then italic. Order matters so ** doesn't get eaten by _.
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(^|[\s(])_([^_]+)_/g, '$1<em>$2</em>');

  return html;
}
