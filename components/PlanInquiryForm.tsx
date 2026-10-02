'use client';

/**
 * The contact form on a pricing page. "Talk to us" links carry `?plan=<id>`;
 * this picks that plan up so the form starts on it. A plan from another
 * audience, or one that no longer exists, is ignored.
 */
import { useSearchParams } from 'next/navigation';
import { InquiryForm } from './InquiryForm';
import { isPlanId, planById, type Audience, type PlanId } from '@/lib/site/plans';
import type { InquiryKind } from '@/lib/inquiry/request';

export const AUDIENCE_KIND: Record<Audience, InquiryKind> = { maker: 'maker', contractor: 'service' };

export function planFromParam(value: string | null, audience: Audience): PlanId | undefined {
  if (value === null || !isPlanId(value)) return undefined;
  return planById(value).audience === audience ? value : undefined;
}

export function PlanInquiryForm({ audience }: { audience: Audience }): React.ReactElement {
  const plan = planFromParam(useSearchParams().get('plan'), audience);
  // Keyed by plan: clicking a different card’s "Talk to us" restarts the form on that plan.
  return <InquiryForm key={plan ?? 'none'} audience={audience} initialKind={AUDIENCE_KIND[audience]} initialPlan={plan} />;
}
