import { cache } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { loadSiteFeatures, type FeatureKey } from './features';

/** The site's features, cached per request so the layout and the page share one query. */
export const getSiteFeatures: (tenantId: string) => Promise<Set<FeatureKey>> = cache((tenantId: string) =>
  loadSiteFeatures(supabaseAdmin(), tenantId),
);
