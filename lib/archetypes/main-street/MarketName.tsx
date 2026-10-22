/**
 * A market's name in any find-us treatment (Alex, 2026-10-22): a link to the
 * market's own page on Market and Full (the row carries `href`), plain text on
 * Showcase. One piece so every treatment links the same way; the underline rule
 * lives in chrome under .ms-fu-link.
 */
import type { ReactElement } from 'react';
import type { FindUsEvent } from './findus';

export function MarketName({ e }: { e: Pick<FindUsEvent, 'where' | 'href'> }): ReactElement {
  return e.href === undefined ? <>{e.where}</> : <a href={e.href} className="ms-fu-link">{e.where}</a>;
}
