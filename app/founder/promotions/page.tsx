import { requireFounder } from '@/lib/founder/access';
import { createPromoCode, endPromoCode } from '@/lib/founder/promo-actions';
import { discountLabel, listPromos } from '@/lib/billing/promos';
import { stripe } from '@/lib/billing/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { ActionForm } from '../ActionForm';
import { DiscountFields } from '../DiscountFields';
import { shortDate } from '../format';

export const dynamic = 'force-dynamic';

/** Promotions: the codes makers can use, and a way to make another. */
export default async function FounderPromotionsPage(): Promise<React.ReactElement> {
  await requireFounder();
  const promos = await listPromos(stripe(), supabaseAdmin());
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Promotions</h1>
      </div>
      <main id="main" className="bk-content">
        <section className="bk-section">
          <h2 className="bk-section-title">Your codes</h2>
          {promos.length === 0 ? (
            <p className="bk-note">No codes yet. Make your first one below.</p>
          ) : (
            <div className="bk-table-wrap">
              <table className="bk-table">
                <thead>
                  <tr>
                    <th scope="col">Code</th>
                    <th scope="col">Gives</th>
                    <th scope="col">For</th>
                    <th scope="col">Used</th>
                    <th scope="col">Last day</th>
                    <th scope="col">End it</th>
                  </tr>
                </thead>
                <tbody>
                  {promos.map((p) => (
                    <tr key={p.code}>
                      <td className="fd-site">{p.code}</td>
                      <td>{discountLabel(p)}</td>
                      <td>{p.audience === 'new' ? 'New sign-ups' : 'Everyone'}</td>
                      <td>{p.maxUses === null ? p.uses : `${p.uses} of ${p.maxUses}`}</td>
                      <td>{p.expires === null ? 'None' : shortDate(p.expires)}</td>
                      <td>
                        <form action={endPromoCode}>
                          <input type="hidden" name="code" value={p.code} />
                          <button type="submit" className="fd-out" aria-label={`End ${p.code}`}>
                            End
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bk-section">
          <h2 className="bk-section-title">Make a code</h2>
          <ActionForm action={createPromoCode} button="Make code">
            <div className="bk-field">
              <label htmlFor="fd-code" className="bk-label">
                Code
              </label>
              <input id="fd-code" name="code" autoComplete="off" className="bk-input" />
            </div>
            <DiscountFields />
            <div className="bk-field">
              <label htmlFor="fd-audience" className="bk-label">
                Who can use it
              </label>
              <select id="fd-audience" name="audience" className="bk-input" defaultValue="new">
                <option value="new">New sign-ups only</option>
                <option value="everyone">New sign-ups and existing makers</option>
              </select>
            </div>
            <div className="bk-field">
              <label htmlFor="fd-expires" className="bk-label">
                Last day to use it
              </label>
              <input id="fd-expires" name="expires" type="date" className="bk-input" />
            </div>
            <div className="bk-field">
              <label htmlFor="fd-uses" className="bk-label">
                Total uses
              </label>
              <input id="fd-uses" name="maxUses" inputMode="numeric" className="bk-input" />
              <p className="bk-note">Leave blank for no limit. Each maker can only ever use a code once.</p>
            </div>
          </ActionForm>
        </section>
      </main>
    </>
  );
}
