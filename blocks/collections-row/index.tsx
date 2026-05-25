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
    <section className="bg-s-surface py-s-section">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-8 text-center sf-heading sf-text-heading">{content.headline}</h2>

        <ul className="flex flex-wrap justify-center gap-4">
          {items.map((collection) => (
            <li key={collection.id}>
              <a
                href={`/collections/${collection.slug}`}
                className="block min-w-[140px] px-6 py-4 text-center sf-card transition-opacity hover:opacity-80"
              >
                <p className="font-medium sf-body text-s-text">{collection.name}</p>
                {collection.description !== null && (
                  <p className="mt-1 text-sm sf-body text-s-muted">{collection.description}</p>
                )}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
