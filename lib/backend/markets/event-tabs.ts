/** The event page's tabs (Alex, 2026-10-22): one job each. Shared by the page (which
 *  reads the tab from the address on the server) and the editor (which shows them). */
export type EventTab = 'details' | 'bringing' | 'sold' | 'after';
export const EVENT_TABS: readonly EventTab[] = ['details', 'bringing', 'sold', 'after'];

export function isEventTab(v: unknown): v is EventTab {
  return (EVENT_TABS as readonly unknown[]).includes(v);
}
