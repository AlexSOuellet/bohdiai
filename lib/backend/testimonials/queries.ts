import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { testimonialFromRow, type Testimonial } from './testimonial-form';

/** A site's testimonials in her order. */
export async function listTestimonials(db: SupabaseClient<Database>, tenantId: string): Promise<Testimonial[]> {
  const { data, error } = await db
    .from('site_testimonials')
    .select('id, quote, name, detail, shown')
    .eq('tenant_id', tenantId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });
  if (error !== null) throw new Error(`Could not load testimonials: ${error.message}`);
  return (data ?? []).map(testimonialFromRow);
}
