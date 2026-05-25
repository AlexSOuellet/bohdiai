import meta from './meta';
import { supabaseAdmin } from '@/lib/supabase';

export { meta };

interface CollectionsRowContent {
  headline: string;
}

interface CollectionsRowProps {
  content: CollectionsRowContent;
  tenantId: string;
}

interface Collection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

export default async function CollectionsRow({ content, tenantId }: CollectionsRowProps) {
  const db = supabaseAdmin();
  const { data: collections } = await db
    .from('collections')
    .select('id, slug, name, description')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('position', { ascending: true })
    .limit(6);

  const items: Collection[] = collections ?? [];

  if (items.length === 0) return null;

  return (
    <section
      style={{
        backgroundColor: 'var(--color-surface)',
        paddingTop: 'var(--spacing-section)',
        paddingBottom: 'var(--spacing-section)',
      }}
    >
      <div className="mx-auto max-w-6xl px-6">
        <h2
          className="mb-8 text-center"
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

        <ul className="flex flex-wrap justify-center gap-4">
          {items.map((collection) => (
            <li key={collection.id}>
              <a
                href={`/collections/${collection.slug}`}
                className="block px-6 py-4 text-center transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: 'var(--color-background)',
                  borderRadius: 'var(--card-border-radius)',
                  border: '1px solid var(--color-border)',
                  minWidth: '140px',
                }}
              >
                <p
                  className="font-medium"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--color-text)',
                    fontSize: '1rem',
                  }}
                >
                  {collection.name}
                </p>
                {collection.description !== null && (
                  <p
                    className="mt-1 text-sm"
                    style={{
                      fontFamily: 'var(--font-body)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {collection.description}
                  </p>
                )}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
