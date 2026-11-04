/**
 * Every site for Alex's admin: who runs it, what plan it's on, what it pays. Read
 * with the server's own key, so only call this behind requireFounder.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { isFounder } from './access';

type Db = SupabaseClient<Database>;

export type FounderSite = {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  plan: string | null;
  planComp: string | null;
  /** The maker's sign-in email; null when only Alex runs the site. */
  maker: string | null;
  /** What the site pays BohdiAI; null when it pays nothing. */
  paying: { cents: number; interval: string } | null;
  joined: string;
  /** Alex's account is on the site, so he can open its backend. */
  canManage: boolean;
};

export type SitesSummary = { sites: number; live: number; monthlyCents: number };

const PLAN_NAMES: Record<string, string> = { free: 'Free', showcase: 'Showcase', lite: 'Market', full: 'Full' };
const STATUS_NAMES: Record<string, string> = { active: 'Live', draft: 'Draft', offline: 'Offline' };
const PAYING_STATUSES = ['active', 'trialing'];

export function planName(plan: string | null): string {
  return plan === null ? 'No plan' : (PLAN_NAMES[plan] ?? plan);
}

export function statusName(status: string): string {
  return STATUS_NAMES[status] ?? status;
}

/** "$5", or "$25.83" when there are cents. */
export function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

/** A yearly plan counts as a twelfth of its price each month. */
export function monthlyCents(paying: FounderSite['paying']): number {
  if (paying === null) return 0;
  return paying.interval === 'year' ? Math.round(paying.cents / 12) : paying.cents;
}

export function summarize(sites: readonly FounderSite[]): SitesSummary {
  return {
    sites: sites.length,
    live: sites.filter((s) => s.status === 'active').length,
    monthlyCents: sites.reduce((sum, s) => sum + monthlyCents(s.paying), 0),
  };
}

/** Every account's email by ID. */
async function emailsById(db: Db): Promise<Map<string, string>> {
  const { data, error } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error !== null) throw new Error(`Could not read the accounts: ${error.message}`);
  return new Map(data.users.map((u) => [u.id, u.email ?? '']));
}

export async function loadFounderSites(db: Db): Promise<FounderSite[]> {
  const [tenants, members, subscriptions, emails] = await Promise.all([
    db.from('tenants').select('id, business_name, subdomain, status, plan, plan_comp, created_at').is('deleted_at', null).order('created_at', { ascending: false }),
    db.from('tenant_members').select('tenant_id, user_id').eq('status', 'active').order('created_at'),
    db.from('subscriptions').select('tenant_id, status, unit_amount_cents, billing_interval'),
    emailsById(db),
  ]);
  if (tenants.error !== null) throw new Error(`Could not read the sites: ${tenants.error.message}`);
  if (members.error !== null) throw new Error(`Could not read who runs the sites: ${members.error.message}`);
  if (subscriptions.error !== null) throw new Error(`Could not read the subscriptions: ${subscriptions.error.message}`);

  return tenants.data.map((t) => {
    const member = members.data.find((m) => m.tenant_id === t.id && !isFounder(m.user_id));
    const sub = subscriptions.data.find((s) => s.tenant_id === t.id && PAYING_STATUSES.includes(s.status) && (s.unit_amount_cents ?? 0) > 0);
    return {
      id: t.id,
      name: t.business_name,
      subdomain: t.subdomain,
      status: t.status,
      plan: t.plan,
      planComp: t.plan_comp,
      maker: member === undefined ? null : (emails.get(member.user_id) ?? null),
      paying: sub === undefined ? null : { cents: sub.unit_amount_cents ?? 0, interval: sub.billing_interval ?? 'month' },
      joined: t.created_at,
      canManage: members.data.some((m) => m.tenant_id === t.id && isFounder(m.user_id)),
    };
  });
}
