/**
 * Main Street — the FIND US beat treatments.
 *
 * Like Reviews and the four nav registers, find-us is a SHARED POOL of treatments
 * (not a per-family shape like the Collections band) — a store wears ONE, and
 * families double up. The beat shows where to meet the maker in person: markets,
 * workshops, popups. Dates are unknown at onboarding, so Bohdi seeds plausible
 * sample rows the maker edits or turns off later (D38). Shown only when the shop
 * has dates; each treatment links to the full Events page.
 *
 *  - board     — a tour-dates list: chronological rows, date-led, editorial. The
 *                workhorse; reads fine with two dates or twenty. (Luxury default.)
 *  - calendar  — a real month grid; the view a maker with a recurring schedule
 *                (weekly markets, standing workshops) leans on. (Modern default.)
 *  - passes    — each date as a torn admission ticket in a horizontal rail;
 *                tactile, "grab a spot" energy. (Cheerful default.)
 *  - next-stop — one nearest date spotlighted huge, the rest trailing small; for
 *                driving people to the very next date. (Dark default.)
 *  - itinerary — the season as a stitched route line, stop after stop, town after
 *                town; a travel-log of where the maker is headed. (Rustic default.)
 *  - poster    — one printed broadside, the whole run of dates set as a playbill.
 *                (Cozy default.)
 *
 * The dates are AUTHORED content in the envelope (`content.founder.findUs`), seeded
 * at build time and maker-editable. No family→default wiring lives in code yet; that
 * arrives with the family layer. Until then the dispatcher falls back to the
 * documented default below. Per-family defaults live in `Family-Style-Sheets.md`.
 */

/** The six find-us treatments, as a tuple — the single source the schema enum and
 *  the authoring menu both read so they can never drift apart. */
export const FINDUS_TREATMENTS = ['board', 'calendar', 'passes', 'next-stop', 'itinerary', 'poster'] as const;
export type FindUsTreatment = (typeof FINDUS_TREATMENTS)[number];

/** One-line purpose for each treatment. The SHAPE is the idea; the family's own
 *  fonts/imagery fill it. */
export const FINDUS_TREATMENT_MENU: Record<FindUsTreatment, string> = {
  board:
    'a tour-dates list — chronological rows, date on the left, venue and hours across; the editorial workhorse that reads fine with two dates or twenty',
  calendar:
    'a real month grid — the view a maker with a recurring schedule (weekly markets, standing workshops) leans on; a pattern at a glance, not a long list',
  passes:
    'each date as a torn admission ticket in a horizontal rail — tactile, "grab a spot" energy',
  'next-stop':
    'one nearest date spotlighted huge, the rest trailing small underneath — for driving people to the very next date',
  itinerary:
    'the season as a stitched route line, stop after stop, town after town — a travel-log of where the maker is headed',
  poster:
    'one printed broadside, the whole run of dates set as a playbill — the season as the artwork',
};

/**
 * The documented fallback treatment for a shop with no authored pick and no family
 * wiring yet. NOT a family default (those live in `Family-Style-Sheets.md` and get
 * wired with the family layer) — just a neutral stand-in so the beat always renders.
 */
export const DEFAULT_FINDUS_TREATMENT: FindUsTreatment = 'board';

/** What kind of appearance a row is — drives an optional pill/marker in some
 *  treatments. Optional on the row; absent → no pill. */
export const FINDUS_KINDS = ['market', 'workshop', 'event'] as const;
export type FindUsKind = (typeof FINDUS_KINDS)[number];

/**
 * One appearance as a renderer sees it.
 *
 * `day` / `where` / `time` are the authored human strings — also read by the plain
 * events-page list and the marquee, so they always stay. `date` (ISO `YYYY-MM-DD`)
 * is optional: when present, the date-shaped treatments (Calendar, Next Stop) place
 * and sort by it, and every treatment can derive the weekday / day-number / month
 * from it instead of parsing the free-text `day`. `kind` tags an optional pill.
 */
export interface FindUsEvent {
  day: string;
  where: string;
  time: string;
  date?: string | undefined;
  kind?: FindUsKind | undefined;
}

/** The find-us SECTION content — the authored heading + cue + the dates themselves.
 *  Mirrors the other section shapes so every treatment reads one contract; the
 *  schema's `founder.findUs` field conforms. */
export interface FindUsSection {
  label: string;
  /** The treatment this shop wears (a family-level look choice). Absent → the
   *  dispatcher falls back to DEFAULT_FINDUS_TREATMENT. */
  treatment?: FindUsTreatment | undefined;
  /** Label for the "see all dates" cue → the Events page. */
  eventsLabel?: string | undefined;
  /** The appearances. Never empty when the beat renders. */
  rows: FindUsEvent[];
}

/** How many appearances the home beat shows — a handful, never a maker's whole
 *  calendar (the full list lives on the Events page). */
export const HOME_FINDUS_SAMPLE = 6;

/** Trim the appearances to the home handful, preserving order. Pure so the
 *  dispatcher, the treatments, and tests share one rule. */
export function sampleEvents(rows: readonly FindUsEvent[]): FindUsEvent[] {
  return rows.slice(0, HOME_FINDUS_SAMPLE);
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;

/** The weekday header labels a calendar grid reads, Sunday-first. */
export const FINDUS_WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** The pieces a date-shaped treatment needs, computed from an ISO date WITHOUT
 *  timezone drift (the string is a plain calendar date, read in UTC). */
export interface FindUsDateParts {
  /** Full year, e.g. 2025. */
  year: number;
  /** 1-based month, 1–12. */
  month: number;
  /** Day of month, 1–31. */
  dayNum: number;
  /** Full weekday, e.g. "Saturday". */
  weekday: string;
  /** Short weekday, e.g. "Sat". */
  weekdayShort: string;
  /** Short month, e.g. "Jul". */
  monthShort: string;
}

/** Parse an ISO `YYYY-MM-DD` into its display pieces. Returns undefined for a
 *  missing or malformed date so callers fall back to the authored `day` string —
 *  never throws (accept-or-coerce, never fail; D57). */
export function parseFindUsDate(iso?: string): FindUsDateParts | undefined {
  if (!iso) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return undefined;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const dayNum = Number(m[3]);
  if (month < 1 || month > 12 || dayNum < 1 || dayNum > 31) return undefined;
  const dt = new Date(Date.UTC(year, month - 1, dayNum));
  const wd = dt.getUTCDay();
  return {
    year,
    month,
    dayNum,
    weekday: WEEKDAYS[wd] ?? '',
    weekdayShort: (WEEKDAYS[wd] ?? '').slice(0, 3),
    monthShort: MONTHS_SHORT[month - 1] ?? '',
  };
}

/** "August 2025" for a month/year — the Calendar treatment's heading. */
export function formatFindUsMonthTitle(year: number, month: number): string {
  return `${MONTHS_LONG[month - 1] ?? ''} ${year}`.trim();
}

/** One cell of a calendar month grid: a padding cell (`dayNum` null) before the 1st,
 *  or a real day carrying whichever appearances fall on it. */
export interface FindUsCalendarCell {
  dayNum: number | null;
  events: FindUsEvent[];
}

/** A month laid out for the Calendar treatment: the title, the leading-padded run of
 *  cells (Sunday-first, one row of 7 per week), and the events shown in it. */
export interface FindUsMonth {
  title: string;
  year: number;
  month: number;
  cells: FindUsCalendarCell[];
  /** The appearances that fall in this month, in date order — feeds the agenda. */
  events: FindUsEvent[];
}

/**
 * Build the month grid the Calendar treatment renders: the month of the SOONEST
 * dated appearance, its days padded to a Sunday-first grid, each event dropped into
 * its day cell. Returns undefined when no row carries a parseable date (a legacy
 * store) so the treatment falls back to a plain agenda. Pure + deterministic —
 * shared by the component and its tests.
 */
export function buildFindUsMonth(rows: readonly FindUsEvent[]): FindUsMonth | undefined {
  const dated = rows
    .map((e) => ({ e, p: parseFindUsDate(e.date) }))
    .filter((x): x is { e: FindUsEvent; p: FindUsDateParts } => x.p !== undefined)
    .sort((a, b) => a.p.year - b.p.year || a.p.month - b.p.month || a.p.dayNum - b.p.dayNum);
  const first = dated[0];
  if (!first) return undefined;

  const { year, month } = first.p;
  const inMonth = dated.filter((x) => x.p.year === year && x.p.month === month);
  const eventsByDay = new Map<number, FindUsEvent[]>();
  for (const { e, p } of inMonth) {
    const list = eventsByDay.get(p.dayNum) ?? [];
    list.push(e);
    eventsByDay.set(p.dayNum, list);
  }

  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: FindUsCalendarCell[] = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push({ dayNum: null, events: [] });
  for (let d = 1; d <= daysInMonth; d += 1) cells.push({ dayNum: d, events: eventsByDay.get(d) ?? [] });

  return { title: formatFindUsMonthTitle(year, month), year, month, cells, events: inMonth.map((x) => x.e) };
}

/**
 * Seed plausible sample find-us dates for the ?findus= preview when a store has no
 * authored calendar — the same non-persisting "placeholder, not labeled" model as
 * the collections / reviews / marquee seeds. Never written to the store; only the
 * preview renders it. Carries ISO dates + kinds so every treatment (Calendar
 * included) is viewable.
 */
export function seedPreviewFindUs(): FindUsSection {
  return {
    label: 'Find us in person',
    eventsLabel: 'See all dates',
    rows: [
      { date: '2025-07-12', day: 'Sat, Jul 12', where: 'Providence Flea — India Point Park', time: '10–4', kind: 'market' },
      { date: '2025-07-20', day: 'Sun, Jul 20', where: 'Hope Street Market — Lippitt Park', time: '9–1', kind: 'market' },
      { date: '2025-07-24', day: 'Thu, Jul 24', where: 'Candle-Pouring Workshop — The Studio, Pawtucket', time: '6–8pm', kind: 'workshop' },
      { date: '2025-08-02', day: 'Sat, Aug 2', where: 'Wickford Art Festival — Wickford Village', time: '10–5', kind: 'event' },
      { date: '2025-08-15', day: 'Fri, Aug 15', where: 'WaterFire — Downtown Providence', time: '7–11pm', kind: 'event' },
    ],
  };
}
