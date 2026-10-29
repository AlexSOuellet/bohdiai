/**
 * Free's Home (Alex, 2026-10-24): the steps to know your numbers, then the numbers.
 * A step is done when the thing it asks for exists, so nothing about the steps is
 * stored. The numbers come from each product's costs. Free has no events (Alex,
 * 2026-10-28), so nothing here reads them.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { loadCostSummaries, pricedBelowCost, type CostSummary } from './product-costs';
import type { Steps } from '@/lib/backend/first-steps';

export type StepKey = 'price' | 'pieces' | 'describe';
export type Step = { key: StepKey; done: boolean; href: string };

export type FreeHome = {
  steps: Step[];
  /** The first step not done yet; null once every one is. */
  next: StepKey | null;
  /** Products priced below what they cost to make. */
  belowCost: { id: string; name: string }[];
  /** Products with no costs worked out. */
  noCosts: number;
  products: number;
};

/** At least this many products and her pieces are ready to show (Showcase's nudge). */
export const PIECES_READY = 3;

export type FreeHomeInput = {
  products: readonly { id: string; name: string; priceCents: number | null; described: boolean }[];
  costs: ReadonlyMap<string, CostSummary>;
};

export function freeHome(input: FreeHomeInput): FreeHome {
  const withCosts = input.products.filter((p) => input.costs.has(p.id));
  const steps: Step[] = [
    { key: 'price', done: withCosts.length > 0, href: '/manage/tools/cost' },
    { key: 'pieces', done: input.products.length >= PIECES_READY, href: '/manage/tools/cost' },
    { key: 'describe', done: input.products.some((p) => p.described), href: '/manage/tools/describe' },
  ];
  return {
    steps,
    next: steps.find((s) => !s.done)?.key ?? null,
    belowCost: input.products.filter((p) => pricedBelowCost(p.priceCents, input.costs.get(p.id) ?? null)).map((p) => ({ id: p.id, name: p.name })),
    noCosts: input.products.length - withCosts.length,
    products: input.products.length,
  };
}

export async function loadFreeHome(db: SupabaseClient<Database>, tenantId: string): Promise<FreeHome> {
  const [products, costs] = await Promise.all([
    db.from('listings').select('id, name, base_price_cents, short_description, description').eq('tenant_id', tenantId).is('deleted_at', null).neq('status', 'archived'),
    loadCostSummaries(db, tenantId),
  ]);
  if (products.error !== null) throw new Error(`Could not read the products: ${products.error.message}`);
  return freeHome({
    products: (products.data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      priceCents: p.base_price_cents > 0 ? p.base_price_cents : null,
      described: (p.short_description ?? '').trim() !== '' || (p.description ?? '').trim() !== '',
    })),
    costs,
  });
}

const STEP_LABELS: Readonly<Record<StepKey, string>> = {
  price: 'Price your first piece',
  pieces: 'Add the rest of your pieces',
  describe: 'Write a description for a piece',
};

/** Free's first steps in the shape every plan's Home shows (the redesign); null once all are done. */
export function freeSteps(view: FreeHome): Steps | null {
  if (view.next === null) return null;
  return { title: 'Know your numbers', steps: view.steps.map((s) => ({ key: s.key, label: STEP_LABELS[s.key], href: s.href, done: s.done })) };
}
