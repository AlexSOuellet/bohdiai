/**
 * Try-on dashboard (founder/dev only, no auth yet — gate before shipping).
 * Lists active tenants with their live archetype and any saved versions, and
 * runs a Gallery→Main Street conversion in place. Accessed at /admin/tryon.
 */
import { supabaseAdmin } from '@/lib/supabase';
import { TryOnButton } from './TryOnButton';

export const dynamic = 'force-dynamic';

// Dev host for storefront links. Subdomains resolve under *.localhost.
const STOREFRONT_HOST = 'localhost:3000';
const storefrontBase = (sub: string) => `http://${sub}.${STOREFRONT_HOST}`;

export default async function TryOnDashboard() {
  const db = supabaseAdmin();

  const { data: tenantsRaw } = await db.from('tenants').select('id, subdomain, business_name').eq('status', 'active').order('created_at', { ascending: false });
  const tenants = tenantsRaw ?? [];
  const ids = tenants.map((t) => t.id);

  const { data: pagesRaw } = ids.length > 0
    ? await db.from('content_pages').select('tenant_id, layout_tree').in('tenant_id', ids)
    : { data: [] };
  const { data: versionsRaw } = ids.length > 0
    ? await db.from('store_versions').select('tenant_id, label').in('tenant_id', ids)
    : { data: [] };

  const archByTenant = new Map<string, string>();
  for (const p of pagesRaw ?? []) {
    const root = (p.layout_tree as { root?: { archetypeKey?: string } } | null)?.root;
    const a = root?.archetypeKey;
    if (typeof a === 'string') archByTenant.set(p.tenant_id, a);
  }
  const versByTenant = new Map<string, string[]>();
  for (const v of versionsRaw ?? []) {
    const arr = versByTenant.get(v.tenant_id) ?? [];
    arr.push(v.label);
    versByTenant.set(v.tenant_id, arr);
  }

  return (
    <main style={{ background: '#0d0d0f', color: '#e8e8e6', minHeight: '100vh', fontFamily: 'ui-sans-serif, system-ui', padding: '40px 48px' }}>
      <h1 style={{ fontSize: 13, letterSpacing: '0.26em', textTransform: 'uppercase', color: '#8a8a86', margin: '0 0 4px' }}>Try-On</h1>
      <p style={{ color: '#6f6f6b', margin: '0 0 32px', fontSize: 14 }}>
        Re-express a store in another archetype as a saved version on the same tenant. Live store stays at <code>/</code>; the conversion previews at <code>/?v=&lt;label&gt;</code>.
      </p>

      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#8a8a86', borderBottom: '1px solid #232325' }}>
            <th style={{ padding: '10px 12px', fontWeight: 500 }}>Shop</th>
            <th style={{ padding: '10px 12px', fontWeight: 500 }}>Live archetype</th>
            <th style={{ padding: '10px 12px', fontWeight: 500 }}>Versions</th>
            <th style={{ padding: '10px 12px', fontWeight: 500 }}>Convert</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((t) => {
            const arch = archByTenant.get(t.id) ?? '—';
            const versions = versByTenant.get(t.id) ?? [];
            return (
              <tr key={t.id} style={{ borderBottom: '1px solid #1a1a1c' }}>
                <td style={{ padding: '12px' }}>
                  <a href={storefrontBase(t.subdomain)} target="_blank" rel="noreferrer" style={{ color: '#e8e8e6', textDecoration: 'none' }}>
                    {t.business_name}
                  </a>
                  <div style={{ color: '#5a5a57', fontSize: 12 }}>{t.subdomain}</div>
                </td>
                <td style={{ padding: '12px', color: arch === 'gallery' ? '#9ad' : '#cda' }}>{arch}</td>
                <td style={{ padding: '12px' }}>
                  {versions.length === 0 ? (
                    <span style={{ color: '#5a5a57' }}>—</span>
                  ) : (
                    versions.map((label) => (
                      <a key={label} href={`${storefrontBase(t.subdomain)}/?v=${label}`} target="_blank" rel="noreferrer" style={{ color: '#4f7cff', marginRight: 12 }}>
                        {label}
                      </a>
                    ))
                  )}
                </td>
                <td style={{ padding: '12px' }}>
                  <TryOnButton subdomain={t.subdomain} target="main-street" label="mainstreet" previewUrl={`${storefrontBase(t.subdomain)}/?v=mainstreet`} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
