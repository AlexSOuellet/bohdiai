// The build status store. A background build writes its progress and result
// here; the onboarding screen polls it. This is the shared state that lets the
// build outlive the request that started it.

import { supabaseAdmin } from '@/lib/supabase';

export type BuildStatus = 'pending' | 'running' | 'done' | 'failed';

export interface BuildInput {
  subdomain: string;
  shopName: string;
  nicheSlug: string;
  moodKey: string;
  productCount?: number;
  makerName?: string | undefined;
  logoUrl?: string | undefined;
  brandColors?: string[] | undefined;
}

export interface BuildRow {
  id: string;
  status: BuildStatus;
  status_label: string | null;
  subdomain: string;
  tenant_id: string | null;
  error: string | null;
}

function builds() {
  return (supabaseAdmin() as unknown as {
    from: (t: string) => {
      insert: (r: unknown) => { select: (c: string) => { single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }> } };
      update: (r: unknown) => { eq: (c: string, v: unknown) => Promise<{ error: { message: string } | null }> };
      select: (c: string) => { eq: (c: string, v: unknown) => { single: () => Promise<{ data: BuildRow | null; error: { message: string } | null }> } };
    };
  }).from('builds');
}

/** Create a pending build and return its id. */
export async function createBuild(input: BuildInput): Promise<string> {
  const { data, error } = await builds()
    .insert({ status: 'pending', subdomain: input.subdomain, input })
    .select('id')
    .single();
  if (error || !data) throw new Error(`createBuild failed: ${error?.message ?? 'no id returned'}`);
  return data.id;
}

/** Mark a build running and set the current progress label. */
export async function markRunning(id: string, label: string): Promise<void> {
  await builds()
    .update({ status: 'running', status_label: label, started_at: new Date().toISOString() })
    .eq('id', id);
}

/** Update the progress label on a running build. */
export async function updateLabel(id: string, label: string): Promise<void> {
  await builds().update({ status_label: label }).eq('id', id);
}

/** Mark a build done, attaching the tenant it produced. */
export async function completeBuild(id: string, tenantId: string): Promise<void> {
  await builds()
    .update({ status: 'done', tenant_id: tenantId, finished_at: new Date().toISOString() })
    .eq('id', id);
}

/** Mark a build failed with a maker-facing message. */
export async function failBuild(id: string, message: string): Promise<void> {
  await builds()
    .update({ status: 'failed', error: message, finished_at: new Date().toISOString() })
    .eq('id', id);
}

/** Read a build's current state, or null if it doesn't exist. */
export async function getBuild(id: string): Promise<BuildRow | null> {
  const { data, error } = await builds().select('*').eq('id', id).single();
  if (error || !data) return null;
  return data;
}
