/**
 * Main Street — the FIND US beat. The market/appointment calendar as its OWN
 * section (split out of the founder beat). Shown only when the maker has dates;
 * links to the full Events page. On the base surface so it alternates after the
 * founder band. Structure only — every value is a skin var or named role; the
 * row markup is the calendar lifted from the old founder beat.
 */
import type { ArchetypeTheme } from '../types';
import type { MainStreetContent } from './schemas';
import { FindUsList } from './FounderBeats';

type FindUs = NonNullable<MainStreetContent['founder']['findUs']>;

export function FindUsBeat({
  findUs,
  eventsHref = '/events',
}: {
  findUs: FindUs;
  skin: ArchetypeTheme;
  eventsHref?: string | undefined;
}) {
  return (
    <section data-ms-findus style={{ background: 'var(--ms-bg)', color: 'var(--ms-fg)', padding: '96px 40px' }}>
      <div className="ms-wrap" style={{ maxWidth: 760 }}>
        <FindUsList findUs={findUs} eventsHref={eventsHref} heading="title" onContrast={false} />
      </div>
    </section>
  );
}
