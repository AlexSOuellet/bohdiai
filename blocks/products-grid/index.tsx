import meta from './meta';
import { supabaseAdmin } from '@/lib/supabase';

export { meta };

interface ProductsGridContent {
  headline: string;
  subtitle?: string;
}

interface ProductsGridProps {
  content: ProductsGridContent;
  tenantId: string;
}

interface Listing {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  base_price_cents: number;
  media_ids: string[];
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default async function ProductsGrid({ content, tenantId }: ProductsGridProps) {
  const db = supabaseAdmin();
  const { data: listings } = await db
    .from('listings')
    .select('id, slug, name, short_description, base_price_cents, media_ids')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .limit(12);

  const items: Listing[] = listings ?? [];

  return (
    <section
      style={{
        backgroundColor: 'var(--color-background)',
        paddingTop: 'var(--spacing-section)',
        paddingBottom: 'var(--spacing-section)',
      }}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 'var(--heading-weight)',
              letterSpacing: 'var(--heading-letter-spacing)',
              color: 'var(--color-text)',
              fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
              lineHeight: '1.2',
            }}
          >
            {content.headline}
          </h2>
          {content.subtitle !== undefined && content.subtitle !== '' && (
            <p
              className="mx-auto mt-3 max-w-xl"
              style={{
                fontFamily: 'var(--font-body)',
                lineHeight: 'var(--body-line-height)',
                fontSize: '1rem',
                color: 'var(--color-text-muted)',
              }}
            >
              {content.subtitle}
            </p>
          )}
        </div>

        {items.length === 0 ? (
          <p
            className="text-center"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)' }}
          >
            Products coming soon.
          </p>
        ) : (
          <ul
            className="grid gap-[var(--card-gap)]"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}
          >
            {items.map((listing) => (
              <li key={listing.id}>
                <a
                  href={`/listings/${listing.slug}`}
                  className="block overflow-hidden transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderRadius: 'var(--card-border-radius)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div
                    style={{
                      aspectRatio: '1 / 1',
                      backgroundColor: 'var(--color-border)',
                      overflow: 'hidden',
                    }}
                  >
                    {listing.media_ids[0] !== undefined ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={listing.media_ids[0]}
                        alt={listing.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                          Photo coming soon
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p
                      className="mb-1 font-medium"
                      style={{
                        fontFamily: 'var(--font-heading)',
                        color: 'var(--color-text)',
                        fontSize: '1rem',
                      }}
                    >
                      {listing.name}
                    </p>
                    {listing.short_description !== null && (
                      <p
                        className="mb-2 line-clamp-2 text-sm"
                        style={{
                          fontFamily: 'var(--font-body)',
                          color: 'var(--color-text-muted)',
                          lineHeight: '1.4',
                        }}
                      >
                        {listing.short_description}
                      </p>
                    )}
                    <p
                      style={{
                        fontFamily: 'var(--font-body)',
                        color: 'var(--color-accent)',
                        fontWeight: 600,
                      }}
                    >
                      {formatPrice(listing.base_price_cents)}
                    </p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
