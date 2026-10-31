/**
 * Puts BohdiAI's plans into Stripe from the one plan list (lib/site/plans.ts):
 * a product per plan and a price per plan and billing, found again by lookup key.
 * Run it again after a price changes: a changed price gets a new Stripe price that
 * takes over the lookup key (Stripe never edits a price); the old one stays for
 * the makers already on it. Nothing is typed into Stripe by hand.
 *
 *   npx tsx --env-file=.env.local scripts/stripe-plans.ts [--dry]
 */
import { productId, stripe, stripePlans } from '../lib/billing/stripe';

async function main(): Promise<void> {
  const dry = process.argv.includes('--dry');
  const s = stripe();
  const plans = stripePlans();
  const found = await s.prices.list({ lookup_keys: plans.map((p) => p.lookupKey), active: true, limit: 100 });
  const byKey = new Map(found.data.map((p) => [p.lookup_key, p]));

  for (const plan of plans) {
    const interval = plan.billing === 'monthly' ? 'month' : 'year';
    const have = byKey.get(plan.lookupKey);
    if (have !== undefined && have.unit_amount === plan.cents && have.recurring?.interval === interval && have.currency === 'usd') {
      process.stdout.write(`ok       ${plan.lookupKey} ($${plan.cents / 100} a ${interval})\n`);
      continue;
    }
    process.stdout.write(`${have === undefined ? 'add' : 'change'}   ${plan.lookupKey} ($${plan.cents / 100} a ${interval})\n`);
    if (dry) continue;

    const id = productId(plan.plan);
    const product = await s.products.retrieve(id).catch(() => null);
    if (product === null) await s.products.create({ id, name: plan.name, metadata: { plan: plan.plan } });
    else if (product.name !== plan.name || !product.active) await s.products.update(id, { name: plan.name, active: true });

    await s.prices.create({
      product: id,
      currency: 'usd',
      unit_amount: plan.cents,
      recurring: { interval },
      lookup_key: plan.lookupKey,
      transfer_lookup_key: true,
      metadata: { plan: plan.plan, billing: plan.billing },
    });
  }
}

main().catch((err: unknown) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
