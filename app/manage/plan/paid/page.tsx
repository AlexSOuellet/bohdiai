import { redirect } from 'next/navigation';
import type { Route } from 'next';
import { finishPaidChange } from '@/lib/backend/plan/actions';

export const dynamic = 'force-dynamic';

/** Back from Stripe's payment page for a plan change (Alex, 2026-11-16): the change is
 *  made once the payment is confirmed, then Your plan (or the site form, moving up from
 *  Free) says what happened. */
export default async function PlanPaidPage({
  searchParams,
}: PageProps<'/manage/plan/paid'>): Promise<never> {
  const raw = (await searchParams)['session'];
  const session = Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '');
  redirect((await finishPaidChange(session)) as Route);
}
