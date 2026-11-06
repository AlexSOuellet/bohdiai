import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireFounder } from '@/lib/founder/access';
import { endFree, giveDiscount, makeFree, removeDiscount } from '@/lib/founder/promo-actions';
import { dollars, loadFounderSites, planName } from '@/lib/founder/sites';
import { supabaseAdmin } from '@/lib/supabase';
import { ActionForm } from '../../ActionForm';
import { DiscountFields } from '../../DiscountFields';

export const dynamic = 'force-dynamic';

/** One maker's money: what they pay, and the discount or free site Alex can give them. */
export default async function FounderMakerPage({ params }: PageProps<'/founder/act/[id]'>): Promise<React.ReactElement> {
  await requireFounder();
  const { id } = await params;
  const site = (await loadFounderSites(supabaseAdmin())).find((s) => s.id === id);
  if (site === undefined) notFound();
  const free = site.planComp !== null;
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">{site.name}</h1>
      </div>
      <main id="main" className="bk-content">
        <p className="bk-note">
          <Link href="/founder/act" className="bk-link">
            Back to Act as a maker
          </Link>
        </p>
        <section className="bk-section">
          <h2 className="bk-section-title">What they pay</h2>
          <p>
            {planName(site.plan)}: {site.paying === null ? 'nothing right now' : `${dollars(site.paying.cents)} a ${site.paying.interval}`}
          </p>
          {site.discount !== null && (
            <>
              <p className="bk-note">Running now: {site.discount}</p>
              {!free && <ActionForm action={removeDiscount} button="Remove discount" tenantId={site.id} quiet />}
            </>
          )}
        </section>

        {!free && (
          <section id="discount" className="bk-section">
            <h2 className="bk-section-title">Give a discount</h2>
            <p className="bk-note">This replaces any discount running. On a yearly plan, months become credit toward their next renewal.</p>
            <ActionForm action={giveDiscount} button="Give discount" tenantId={site.id}>
              <DiscountFields />
            </ActionForm>
          </section>
        )}

        <section id="free" className="bk-section">
          <h2 className="bk-section-title">{free ? 'Free site' : 'Make them free'}</h2>
          {free ? (
            <ActionForm action={endFree} button="Back to paying" tenantId={site.id} />
          ) : (
            <ActionForm action={makeFree} button="Make free" tenantId={site.id}>
              <div className="bk-field">
                <label htmlFor="fd-note" className="bk-label">
                  Why, just for you
                </label>
                <input id="fd-note" name="note" maxLength={500} className="bk-input" />
              </div>
            </ActionForm>
          )}
        </section>
      </main>
    </>
  );
}
