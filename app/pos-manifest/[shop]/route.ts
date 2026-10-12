import { supabaseAdmin } from '@/lib/supabase';
import { posManifest } from '@/lib/backend/pos-app';

/** The Market POS home-screen manifest for one shop (lib/backend/pos-app.ts). Only
 *  the shop's public name is read; an unknown shop gets the plain "Market POS". */
export async function GET(_req: Request, { params }: { params: Promise<{ shop: string }> }): Promise<Response> {
  const { shop } = await params;
  let name: string | null = null;
  if (/^[a-z0-9-]{1,63}$/.test(shop)) {
    const { data } = await supabaseAdmin().from('tenants').select('business_name').eq('subdomain', shop).is('deleted_at', null).maybeSingle();
    name = data?.business_name ?? null;
  }
  return new Response(JSON.stringify(posManifest(name)), {
    headers: { 'content-type': 'application/manifest+json', 'cache-control': 'public, max-age=3600' },
  });
}
