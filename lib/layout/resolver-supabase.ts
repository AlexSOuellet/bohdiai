import { supabaseAdmin } from '@/lib/supabase';
import type {
  ResolveContext,
  ResolvedCart,
  ResolvedCollection,
  ResolvedEvent,
  ResolvedNavLink,
  ResolvedProduct,
  ResolvedSocialLink,
  ResolvedSubscription,
} from './resolved';

interface ListingRow {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  base_price_cents: number | null;
  is_preview: boolean | null;
  metadata: { image_url?: string } | null;
  subscription_interval?: string | null;
  description?: string | null;
}

function imageUrlFromMetadata(metadata: ListingRow['metadata']): string | undefined {
  if (metadata === null || metadata === undefined) return undefined;
  const u = metadata.image_url;
  return typeof u === 'string' && u !== '' ? u : undefined;
}

function rowToProduct(row: ListingRow): ResolvedProduct {
  const imageUrl = imageUrlFromMetadata(row.metadata);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    ...(row.short_description !== null
      ? { shortDescription: row.short_description }
      : {}),
    ...(row.base_price_cents !== null ? { priceCents: row.base_price_cents } : {}),
    ...(imageUrl !== undefined ? { imageUrl } : {}),
    isPreview: row.is_preview === true,
  };
}

function rowToSubscription(row: ListingRow): ResolvedSubscription {
  return {
    id: row.id,
    name: row.name,
    priceCents: row.base_price_cents ?? 0,
    interval: row.subscription_interval ?? 'monthly',
    ...(row.short_description !== null && row.short_description !== undefined
      ? { description: row.short_description }
      : {}),
    perks: [],
  };
}

export function createResolveContextForTenant(tenantId: string): ResolveContext {
  const db = supabaseAdmin();

  return {
    tenantId,

    async fetchProducts(args) {
      let query = db
        .from('listings')
        .select(
          'id, slug, name, short_description, base_price_cents, is_preview, metadata, primary_collection_id',
        )
        .eq('tenant_id', tenantId)
        .eq('listing_type', 'product')
        .eq('status', 'active');

      if (args.manualIds !== undefined && args.manualIds.length > 0) {
        query = query.in('id', args.manualIds);
      } else if (args.filter?.collectionSlug !== undefined) {
        const { data: collection } = await db
          .from('collections')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('slug', args.filter.collectionSlug)
          .maybeSingle();
        if (collection !== null) {
          query = query.eq('primary_collection_id', collection.id);
        }
      }

      const order = args.order ?? 'featured';
      switch (order) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'price-asc':
          query = query.order('base_price_cents', { ascending: true });
          break;
        case 'price-desc':
          query = query.order('base_price_cents', { ascending: false });
          break;
        case 'manual':
        case 'featured':
        default:
          query = query.order('created_at', { ascending: false });
      }

      query = query.limit(args.count);

      const { data } = await query;
      return (data ?? []).map((row) => rowToProduct(row as unknown as ListingRow));
    },

    async fetchProduct(id) {
      const { data } = await db
        .from('listings')
        .select(
          'id, slug, name, short_description, base_price_cents, is_preview, metadata',
        )
        .eq('tenant_id', tenantId)
        .eq('id', id)
        .maybeSingle();
      if (data === null) return undefined;
      return rowToProduct(data as ListingRow);
    },

    async fetchCollections(args) {
      let query = db
        .from('collections')
        .select('id, slug, name, description')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .is('deleted_at', null);

      if (args.manualSlugs !== undefined && args.manualSlugs.length > 0) {
        query = query.in('slug', args.manualSlugs);
      }

      query = query.order('position', { ascending: true }).limit(args.count);
      const { data } = await query;

      const collections = data ?? [];
      const result: ResolvedCollection[] = [];
      for (const c of collections) {
        const { count } = await db
          .from('listings')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('primary_collection_id', c.id);
        result.push({
          slug: c.slug,
          name: c.name,
          itemCount: count ?? 0,
        });
      }
      return result;
    },

    async fetchCollection(slug) {
      const { data } = await db
        .from('collections')
        .select('id, slug, name, description')
        .eq('tenant_id', tenantId)
        .eq('slug', slug)
        .maybeSingle();
      if (data === null) return undefined;
      const { count } = await db
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('primary_collection_id', data.id);
      return {
        slug: data.slug,
        name: data.name,
        itemCount: count ?? 0,
      };
    },

    async fetchSubscriptions(count) {
      const { data } = await db
        .from('listings')
        .select(
          'id, slug, name, short_description, base_price_cents, is_preview, metadata, subscription_interval, description',
        )
        .eq('tenant_id', tenantId)
        .eq('listing_type', 'subscription')
        .eq('status', 'active')
        .limit(count);
      return (data ?? []).map((row) => rowToSubscription(row as unknown as ListingRow));
    },

    async fetchSubscription(id) {
      const { data } = await db
        .from('listings')
        .select(
          'id, slug, name, short_description, base_price_cents, is_preview, metadata, subscription_interval, description',
        )
        .eq('tenant_id', tenantId)
        .eq('id', id)
        .eq('listing_type', 'subscription')
        .maybeSingle();
      if (data === null) return undefined;
      return rowToSubscription(data as ListingRow);
    },

    async fetchSocialLinks(): Promise<ResolvedSocialLink[]> {
      return [];
    },

    async fetchNavLinks(): Promise<ResolvedNavLink[]> {
      const { data } = await db
        .from('content_pages')
        .select('slug, title, nav_label, nav_position')
        .eq('tenant_id', tenantId)
        .eq('status', 'published')
        .is('deleted_at', null)
        .eq('is_in_nav', true)
        .order('nav_position', { ascending: true });
      return (data ?? []).map((p, i) => ({
        slug: p.slug,
        label: p.nav_label ?? p.title,
        order: p.nav_position ?? i,
      }));
    },

    async fetchEvents(args): Promise<ResolvedEvent[]> {
      const today = new Date().toISOString().slice(0, 10);
      let query = db
        .from('events')
        .select('id, name, event_date, location, notes')
        .eq('tenant_id', tenantId);
      if (args.upcoming) {
        query = query.gte('event_date', today);
      }
      query = query.order('event_date', { ascending: true }).limit(args.count);
      const { data } = await query;
      return (data ?? []).map((e) => ({
        id: e.id,
        name: e.name,
        date: e.event_date,
        ...(e.location !== null ? { location: e.location } : {}),
        ...(e.notes !== null ? { description: e.notes } : {}),
      }));
    },

    async fetchCart(): Promise<ResolvedCart> {
      return { lines: [], subtotalCents: 0 };
    },
  };
}
