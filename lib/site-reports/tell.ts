/** Alex's email for each new report (go-live step 3). A failed send is logged, never
 *  shown to the person reporting: the report is already saved in the Reports tab. */
import { resend, fromEmail } from '@/lib/resend';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';
import { logger } from '@/lib/logger';
import type { ReportReason } from './report';

/** How Alex sees each reason, in his admin and his email. */
export const REASON_NAMES: Record<ReportReason, string> = {
  illegal: 'Something illegal or on the can’t-be-sold list',
  hateful: 'Hateful, threatening or harassing',
  scam: 'A scam',
  mine: 'My photos or my work',
  other: 'Something else',
};

export function reportEmail(r: {
  siteName: string;
  subdomain: string;
  tenantId: string;
  reason: ReportReason;
  details: string;
  email: string;
}): { subject: string; text: string } {
  return {
    subject: `Report: ${r.siteName} (${REASON_NAMES[r.reason]})`,
    text: [
      `Someone reported ${r.siteName} (${r.subdomain}.bohdiai.com).`,
      `Why: ${REASON_NAMES[r.reason]}`,
      `What they said:\n${r.details}`,
      r.email === '' ? 'They left no email.' : `Their email, for a reply: ${r.email}`,
      `The site in your admin (suspend it from there): https://app.bohdiai.com/founder/act/${r.tenantId}#suspend`,
    ].join('\n\n'),
  };
}

export async function tellAlex(r: Parameters<typeof reportEmail>[0]): Promise<void> {
  try {
    const { error } = await resend().emails.send({
      from: fromEmail(),
      to: SITE_CONTACT_EMAIL,
      ...reportEmail(r),
    });
    if (error !== null) throw new Error(error.message);
  } catch (err) {
    logger.error('site report: email failed', {
      subdomain: r.subdomain,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
