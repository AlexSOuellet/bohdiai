/**
 * Every "Report this site" report, newest first, with the site it's about. Read with
 * the server's own key, so only call this behind requireFounder.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { isReportReason, type ReportReason } from './report';

export type SiteReport = {
  id: string;
  tenantId: string;
  siteName: string;
  subdomain: string;
  /** The site's state now: a suspended site shows it's been dealt with. */
  status: string;
  reason: ReportReason | 'other';
  details: string;
  email: string;
  sent: string;
};

const SHOWN = 500;

export async function loadSiteReports(db: SupabaseClient<Database>): Promise<SiteReport[]> {
  const { data, error } = await db
    .from('site_reports')
    .select(
      'id, tenant_id, reason, details, email, created_at, tenants(business_name, subdomain, status)',
    )
    .order('created_at', { ascending: false })
    .limit(SHOWN);
  if (error !== null) throw new Error(`Could not read the reports: ${error.message}`);
  return data.map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    siteName: r.tenants?.business_name ?? 'A site since removed',
    subdomain: r.tenants?.subdomain ?? '',
    status: r.tenants?.status ?? '',
    reason: isReportReason(r.reason) ? r.reason : 'other',
    details: r.details,
    email: r.email,
    sent: r.created_at,
  }));
}
