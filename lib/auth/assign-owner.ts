// The ownership seam. When a store finishes building, the maker who signed up
// at onboarding step 1 becomes its admin (D59 — roles per shop). Account-first
// onboarding guarantees a signed-in maker, so a missing user here is an
// invariant violation worth logging loudly — and a failed write leaves a shop
// nobody can manage, so it's logged hard rather than swallowed silently. Neither
// case throws: the build itself already succeeded and runs detached.

import { addShopOwner } from './membership';
import { logger } from '@/lib/logger';

export async function assignShopOwner(userId: string | null, tenantId: string): Promise<void> {
  if (!userId) {
    logger.error('onboarding: store built with no signed-in maker — shop is unowned', { tenantId });
    return;
  }

  try {
    await addShopOwner(userId, tenantId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'addShopOwner failed';
    logger.error('onboarding: failed to link shop owner — shop is unowned', { tenantId, userId, error: message });
  }
}
