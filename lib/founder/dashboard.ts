/**
 * The numbers on Alex's dashboard. Every self-serve sign-up has a subscription
 * (Free included), so sign-ups count subscriptions, not sites: hand-built samples
 * aren't sign-ups. Months run on Alex's clock. Read with the server's own key, so
 * only call this behind requireFounder.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { loadFounderMessages } from './messages';
import { loadFounderSites, monthlyCents, type FounderSite } from './sites';

type Db = SupabaseClient<Database>;

export type SubscriptionDates = { tenant_id: string; status: string; created_at: string; canceled_at: string | null };

export type PlanLine = { plan: string | null; paying: number; monthlyCents: number };
export type LatestSignup = { id: string; name: string; plan: string | null; maker: string | null; joined: string };

export type Dashboard = {
  mrrCents: number;
  paying: number;
  signups: { thisMonth: number; lastMonth: number };
  cancels: { thisMonth: number; leaving: number };
  sites: { live: number; drafts: number; free: number };
  needs: { failing: number; stuck: number; messages: number };
  plans: PlanLine[];
  latest: LatestSignup[];
};

const FAILING_STATUSES = ['past_due', 'unpaid', 'incomplete'];
const LATEST_SHOWN = 5;
/** A site form still unbuilt after this long has stopped, not just started. */
const STUCK_AFTER_MS = 60 * 60 * 1000;

const MONTH = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit' });

/** "2026-11": the month a moment falls in, on Alex's clock. */
export function monthKey(when: string | Date): string {
  return MONTH.format(new Date(when));
}

export function previousMonth(key: string): string {
  const year = Number(key.slice(0, 4));
  const month = Number(key.slice(5, 7));
  return month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, '0')}`;
}

function planLines(sites: readonly FounderSite[]): PlanLine[] {
  const lines = new Map<string | null, PlanLine>();
  for (const site of sites) {
    if (site.paying === null) continue;
    const line = lines.get(site.plan) ?? { plan: site.plan, paying: 0, monthlyCents: 0 };
    lines.set(site.plan, { ...line, paying: line.paying + 1, monthlyCents: line.monthlyCents + monthlyCents(site.paying) });
  }
  return [...lines.values()].sort((a, b) => b.monthlyCents - a.monthlyCents);
}

export function buildDashboard(input: { sites: readonly FounderSite[]; subscriptions: readonly SubscriptionDates[]; stuck: number; messageDates: readonly string[]; now: Date }): Dashboard {
  const { sites, subscriptions, stuck, messageDates, now } = input;
  const thisMonth = monthKey(now);
  const lastMonth = previousMonth(thisMonth);
  const byId = new Map(sites.map((s) => [s.id, s]));
  const paying = sites.filter((s) => s.paying !== null);
  const newest = [...subscriptions].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return {
    mrrCents: paying.reduce((sum, s) => sum + monthlyCents(s.paying), 0),
    paying: paying.length,
    signups: {
      thisMonth: subscriptions.filter((s) => monthKey(s.created_at) === thisMonth).length,
      lastMonth: subscriptions.filter((s) => monthKey(s.created_at) === lastMonth).length,
    },
    cancels: {
      thisMonth: subscriptions.filter((s) => s.canceled_at !== null && monthKey(s.canceled_at) === thisMonth).length,
      leaving: sites.filter((s) => s.leaving).length,
    },
    sites: {
      live: sites.filter((s) => s.status === 'active').length,
      drafts: sites.filter((s) => s.status === 'draft').length,
      free: sites.filter((s) => s.planComp !== null).length,
    },
    needs: {
      failing: subscriptions.filter((s) => FAILING_STATUSES.includes(s.status)).length,
      stuck,
      messages: messageDates.filter((d) => monthKey(d) === thisMonth).length,
    },
    plans: planLines(sites),
    latest: newest.slice(0, LATEST_SHOWN).flatMap((sub) => {
      const site = byId.get(sub.tenant_id);
      return site === undefined ? [] : [{ id: site.id, name: site.name, plan: site.plan, maker: site.maker, joined: sub.created_at }];
    }),
  };
}

export async function loadDashboard(db: Db, now: Date = new Date()): Promise<Dashboard> {
  const stuckBefore = new Date(now.getTime() - STUCK_AFTER_MS).toISOString();
  const [sites, subscriptions, unbuilt, messages] = await Promise.all([
    loadFounderSites(db),
    db.from('subscriptions').select('tenant_id, status, created_at, canceled_at'),
    db.from('intakes').select('id').neq('status', 'built').lt('created_at', stuckBefore),
    loadFounderMessages(db),
  ]);
  if (subscriptions.error !== null) throw new Error(`Could not read the subscriptions: ${subscriptions.error.message}`);
  if (unbuilt.error !== null) throw new Error(`Could not read the site forms: ${unbuilt.error.message}`);
  return buildDashboard({ sites, subscriptions: subscriptions.data, stuck: unbuilt.data.length, messageDates: messages.map((m) => m.sent), now });
}
