/**
 * MARQUEE — the loud scrolling-type band.
 *
 * One shape for every family (unlike the six-shape Collections band or the eight
 * goods treatments): a full-width band of big display type that scrolls slowly and
 * seamlessly, phrases separated by a diamond. It is the same bones everywhere — the
 * family does the rest through the skin, so the band is rust-on-barnwood for Rustic
 * and red-candy for Cheerful without a line of per-family code. An attention grab,
 * not a content section: what it SAYS is niche/family-specific (brand-voice phrases
 * plus live strings — "New this week", "Find us Saturdays"), but how it LOOKS is
 * fixed. Where it sits in the stack is a per-family choice that arrives with the
 * family layer; today it renders in its default handoff slot (right under the hero).
 *
 * Skin-agnostic and class-only: the band is the skin's own accent surface
 * (`--ms-accent` / `--ms-on-accent`), the type is the `goodsHead` display role, and
 * all motion + placement live in skinVarsCss under `.ms-mq-*` — never inline. The
 * run is duplicated for a seamless -50% loop (reusing the `ms-scroll` keyframe); the
 * second copy is `aria-hidden` so a screen reader reads the phrases once, and the
 * whole band goes static under reduced-motion.
 */
import type { ArchetypeTheme } from '../types';
import { Type } from './Type';

/** One scrolling run of the phrases — the band renders two of these (the second
 *  hidden from assistive tech) so the -50% translate loops without a seam. */
function MarqueeRun({ items, hidden }: { items: readonly string[]; hidden?: boolean }) {
  return (
    <span className="ms-mq-run" aria-hidden={hidden ? true : undefined}>
      {items.map((phrase, i) => (
        <span className="ms-mq-cell" key={`${phrase}-${i}`}>
          <Type as="span" role="goodsHead" className="ms-mq-item">
            {phrase}
          </Type>
          <Type as="span" role="goodsHead" className="ms-mq-sep" aria-hidden={true}>
            ◆
          </Type>
        </span>
      ))}
    </span>
  );
}

export function MarqueeBeat({
  items,
  skin: _skin,
}: {
  items: readonly string[];
  skin: ArchetypeTheme;
}) {
  if (items.length === 0) return null;
  return (
    <section className="ms-mq-band" aria-label="Highlights">
      <div className="ms-mq-track">
        <MarqueeRun items={items} />
        <MarqueeRun items={items} hidden />
      </div>
    </section>
  );
}
