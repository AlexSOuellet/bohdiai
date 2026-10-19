'use server';
/**
 * Contact support: keep a copy of a maker's message for Alex's admin and email it
 * to him, the maker as reply-to.
 * Rate-limited per person (fails closed, like every form). Every failure returns a
 * message the maker can act on.
 */
import { requireActingSite } from '@/lib/backend/current-site';
import { allowKey } from '@/lib/backend/action-limit';
import { resend, fromEmail } from '@/lib/resend';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';
import type { DoneResult } from '../catalog/results';
import { checkSupportMessage, supportEmail } from './support-form';

export async function sendSupportMessage(message: string): Promise<DoneResult> {
  if (typeof message !== 'string') return { ok: false, error: 'Write your message first.' };
  const checked = checkSupportMessage(message);
  if (!checked.ok) return checked;
  const { user, site } = await requireActingSite();
  const allowed = await allowKey(`support:${user.id}`);
  if (allowed === 'limited') return { ok: false, error: 'You’ve sent several messages just now. Wait a few minutes and send again.' };
  if (allowed === 'unavailable') return { ok: false, error: 'Your message couldn’t be sent right now. Try again in a few minutes, or email alex@bohdiai.com.' };
  const email = user.email ?? '';
  // A copy for Alex's admin first, so a message is never lost even if the email fails.
  const { error: saveErr } = await supabaseAdmin().from('support_messages').insert({ tenant_id: site.tenantId, user_id: user.id, email, message: checked.message });
  if (saveErr !== null) logger.error('support message copy failed', { tenantId: site.tenantId, error: saveErr.message });
  const mail = supportEmail({ siteName: site.businessName, subdomain: site.subdomain, email, message: checked.message });
  try {
    const { error } = await resend().emails.send({ from: fromEmail(), to: SITE_CONTACT_EMAIL, ...(email === '' ? {} : { replyTo: email }), ...mail });
    if (error !== null) throw new Error(error.message);
  } catch (err) {
    logger.error('support message failed', { tenantId: site.tenantId, error: err instanceof Error ? err.message : String(err) });
    return { ok: false, error: 'Your message couldn’t be sent right now. Try again in a few minutes, or email alex@bohdiai.com.' };
  }
  return { ok: true };
}
