import { requireFounder } from '@/lib/founder/access';
import { inviteMaker, sendInviteAgain } from '@/lib/founder/promo-actions';
import { loadWaitingInvites } from '@/lib/founder/invites';
import { stripe } from '@/lib/billing/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { ActionForm } from '../ActionForm';
import { DiscountFields } from '../DiscountFields';

export const dynamic = 'force-dynamic';

/** Invite a maker: a free site with no payment step, or a discount already on their link. */
export default async function FounderInvitePage(): Promise<React.ReactElement> {
  await requireFounder();
  const waiting = await loadWaitingInvites(stripe(), supabaseAdmin());
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Invite a maker</h1>
      </div>
      <main id="main" className="bk-content">
        <section className="bk-section">
          <h2 className="bk-section-title">Send an invite</h2>
          <ActionForm action={inviteMaker} button="Send invite">
            <div className="bk-field">
              <label htmlFor="fd-name" className="bk-label">
                Their name
              </label>
              <input id="fd-name" name="name" autoComplete="off" maxLength={120} className="bk-input" />
            </div>
            <div className="bk-field">
              <label htmlFor="fd-email" className="bk-label">
                Their email
              </label>
              <input id="fd-email" name="email" type="email" autoComplete="off" className="bk-input" />
            </div>
            <div className="bk-field">
              <label htmlFor="fd-business" className="bk-label">
                Business name
              </label>
              <input id="fd-business" name="business" autoComplete="off" maxLength={120} className="bk-input" />
            </div>
            <div className="bk-field">
              <label htmlFor="fd-plan" className="bk-label">
                Plan
              </label>
              <select id="fd-plan" name="plan" className="bk-input" defaultValue="full">
                <option value="showcase">Showcase</option>
                <option value="lite">Market</option>
                <option value="full">Full</option>
              </select>
            </div>
            <DiscountFields freeSite />
            <div className="bk-field">
              <label htmlFor="fd-line" className="bk-label">
                A line from you
              </label>
              <input id="fd-line" name="note" maxLength={500} className="bk-input" />
              <p className="bk-note">Added to the email. Leave blank for none.</p>
            </div>
          </ActionForm>
        </section>

        <section className="bk-section">
          <h2 className="bk-section-title">Waiting to start</h2>
          {waiting.length === 0 ? (
            <p className="bk-note">Nobody’s waiting. Anyone you invite shows here until they start.</p>
          ) : (
            <ul className="fd-signups">
              {waiting.map((w) => (
                <li key={w.key}>
                  <span>
                    <span className="fd-site">{w.business}</span>
                    <span className="fd-address">
                      {w.name}, {w.email}, {w.deal}
                    </span>
                  </span>
                  <ActionForm action={sendInviteAgain} button="Send again" quiet>
                    {w.tenantId !== null && <input type="hidden" name="tenantId" value={w.tenantId} />}
                    {w.code !== null && <input type="hidden" name="code" value={w.code} />}
                  </ActionForm>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
