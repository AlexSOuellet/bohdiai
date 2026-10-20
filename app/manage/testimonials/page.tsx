import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { listTestimonials } from '@/lib/backend/testimonials/queries';
import { TestimonialsManager } from './TestimonialsManager';

export const dynamic = 'force-dynamic';

export default async function TestimonialsPage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('testimonials')) notFound();
  const items = await listTestimonials(await createSupabaseServerClient(), site.tenantId);
  return <TestimonialsManager initial={items} picks={!on.has('testimonials_all')} />;
}
