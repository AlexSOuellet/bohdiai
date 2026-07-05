/**
 * Preview-only seed for the `?findus=<treatment>` dev preview.
 *
 * This content is NEVER shown on a real live storefront. It exists solely so a
 * developer looking at `subdomain.localhost:3000/?findus=calendar` sees SOMETHING
 * populated when a test store hasn't authored its find-us calendar yet. A real
 * build authors its own find-us rows through the copywriter; this file is
 * unreachable from production render paths.
 *
 * The venue names are Rhode-Island-specific because Rhody Strong / Soul Splatter
 * were the reference test stores; they are illustrative, not defaults.
 */
import type { FindUsEvent, FindUsSection } from '../findus';
import { stampFindUsDates } from '../findus';

const PREVIEW_ROWS: FindUsEvent[] = [
  { day: '', where: 'Providence Flea — India Point Park', time: '10–4', kind: 'market' },
  { day: '', where: 'Hope Street Market — Lippitt Park', time: '9–1', kind: 'market' },
  { day: '', where: 'Candle-Pouring Workshop — The Studio, Pawtucket', time: '6–8pm', kind: 'workshop' },
  { day: '', where: 'Wickford Art Festival — Wickford Village', time: '10–5', kind: 'event' },
  { day: '', where: 'WaterFire — Downtown Providence', time: '7–11pm', kind: 'event' },
];

/** Build a preview-only find-us section. Dates are stamped relative to `today`
 *  (default now) so the Calendar preview always lands on the current month and
 *  every treatment is viewable. */
export function seedPreviewFindUsFixture(today: Date = new Date()): FindUsSection {
  return {
    label: 'Find us in person',
    eventsLabel: 'See all dates',
    rows: stampFindUsDates(PREVIEW_ROWS, today),
  };
}
