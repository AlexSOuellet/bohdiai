/**
 * MARQUEE — the loud scrolling-type band.
 *
 * One shape for every family (unlike the six-shape Collections band or the eight
 * goods treatments): a full-width band of big display type on the skin's own accent
 * surface. Two rows, mirroring the original mockup — a BRIGHT brand-voice line over
 * a DIM logistics line — scrolling in opposite directions, slow and seamless. Same
 * bones everywhere; the family does the rest through the skin, so it's
 * rust-on-barnwood for Rustic and red-candy for Cheerful with no per-family code.
 *
 * The two lines' CONTENT is never hardcoded — it is assembled from the store's own
 * authored copy and live data (see marquee.ts / buildMarqueeLines). Either line can
 * be empty; the band renders whichever have content, and nothing when both are.
 *
 * Skin-agnostic and class-only: band = `--ms-accent` / `--ms-on-accent`, type = the
 * `goodsHead` display role, motion + placement live in skinVarsCss under `.ms-mq-*`
 * — never inline. Each row is duplicated for a seamless loop (reusing `ms-scroll`);
 * the second copy is `aria-hidden` so a screen reader reads the phrases once, and
 * every row goes static under reduced-motion.
 */
import type { ArchetypeTheme } from '../types';
import { Type } from './Type';
import type { MarqueeLines } from './marquee';

import type { TypeRoleName } from './Type';

/** One scrolling run of a line's phrases — each row renders two (the second hidden
 *  from assistive tech) so the -50% translate loops without a seam. `role` sets the
 *  register: the voice line runs loud (goodsHead), the info line a step down. */
function MarqueeRun({ items, role, hidden }: { items: readonly string[]; role: TypeRoleName; hidden?: boolean }) {
  return (
    <span className="ms-mq-run" aria-hidden={hidden ? true : undefined}>
      {items.map((phrase, i) => (
        <span className="ms-mq-cell" key={`${phrase}-${i}`}>
          <Type as="span" role={role} className="ms-mq-item">
            {phrase}
          </Type>
          <Type as="span" role={role} className="ms-mq-sep" aria-hidden={true}>
            ◆
          </Type>
        </span>
      ))}
    </span>
  );
}

/** One row = one scrolling line. `variant` carries the row's look/direction
 *  modifiers (the dim, reversed logistics line vs. the bright voice line). */
function MarqueeRow({ items, role, variant }: { items: readonly string[]; role: TypeRoleName; variant?: string }) {
  return (
    <div className={variant ? `ms-mq-track ${variant}` : 'ms-mq-track'}>
      <MarqueeRun items={items} role={role} />
      <MarqueeRun items={items} role={role} hidden />
    </div>
  );
}

export function MarqueeBeat({
  lines,
  skin: _skin,
}: {
  lines: MarqueeLines;
  skin: ArchetypeTheme;
}) {
  const hasVoice = lines.voice.length > 0;
  const hasInfo = lines.info.length > 0;
  if (!hasVoice && !hasInfo) return null;
  return (
    <section className="ms-mq-band" aria-label="Highlights">
      {/* Voice line loud (goodsHead); info line a step down (cardTitle) so the two
          registers read as hierarchy and never crowd each other vertically. */}
      {hasVoice && <MarqueeRow items={lines.voice} role="goodsHead" />}
      {hasInfo && <MarqueeRow items={lines.info} role="cardTitle" variant="rev dim" />}
    </section>
  );
}
