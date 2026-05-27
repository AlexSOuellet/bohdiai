import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NotifyInterestSchema = z.object({
  tenantId: z.string().uuid(),
  listingId: z.string().uuid(),
  email: z.string().trim().toLowerCase().email('That doesn’t look like a valid email.').max(254),
});

export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (err) {
    logger.error('notify-interest fatal', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}

async function handle(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const parsed = NotifyInterestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input.' },
      { status: 400 },
    );
  }

  const { tenantId, listingId, email } = parsed.data;
  const db = supabaseAdmin();

  // Verify the listing belongs to this tenant and is currently in preview mode
  // (so we don't capture interest for already-launched listings).
  const { data: listing, error: lookupError } = await db
    .from('listings')
    .select('id, tenant_id, is_preview')
    .eq('id', listingId)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .maybeSingle();

  if (lookupError !== null) {
    logger.error('notify-interest: listing lookup failed', { tenantId, listingId, error: lookupError.message });
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
  if (listing === null) {
    return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
  }
  if (!listing.is_preview) {
    return NextResponse.json({ error: 'This listing is already live.' }, { status: 409 });
  }

  // Insert; the unique (listing_id, email) constraint quietly dedupes repeat signups.
  const { error: insertError } = await db
    .from('notify_interest')
    .insert({ tenant_id: tenantId, listing_id: listingId, email });

  // Duplicate key is a successful no-op from the user's perspective — they're already on the list.
  if (insertError !== null && insertError.code !== '23505') {
    logger.error('notify-interest: insert failed', {
      tenantId,
      listingId,
      error: insertError.message,
    });
    return NextResponse.json({ error: 'Failed to save. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
