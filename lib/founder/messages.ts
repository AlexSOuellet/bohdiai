/**
 * What makers sent through Contact support, newest first. Read with the server's own
 * key, so only call this behind requireFounder.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export type FounderMessage = { id: string; site: string; email: string; message: string; sent: string };

const SHOWN = 200;

export async function loadFounderMessages(db: SupabaseClient<Database>): Promise<FounderMessage[]> {
  const [messages, tenants] = await Promise.all([
    db.from('support_messages').select('id, tenant_id, email, message, created_at').order('created_at', { ascending: false }).limit(SHOWN),
    db.from('tenants').select('id, business_name'),
  ]);
  if (messages.error !== null) throw new Error(`Could not read the messages: ${messages.error.message}`);
  if (tenants.error !== null) throw new Error(`Could not read the sites: ${tenants.error.message}`);
  const names = new Map(tenants.data.map((t) => [t.id, t.business_name]));
  return messages.data.map((m) => ({ id: m.id, site: names.get(m.tenant_id) ?? '', email: m.email, message: m.message, sent: m.created_at }));
}
