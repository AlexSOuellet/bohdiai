import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { HOME_CONTRIBUTORS, collectHome } from '@/lib/backend/home';
import { StatTile } from './_components/StatTile';

export const dynamic = 'force-dynamic';

export default async function ManageHome(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  const home = await collectHome(HOME_CONTRIBUTORS, on, site.tenantId);
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">{site.businessName}</h1>
      </div>
      <main id="main" className="bk-content">
        {home.attention.length > 0 && (
          <section className="bk-attention" aria-labelledby="bk-attn">
            <p id="bk-attn" className="bk-kicker">Needs attention</p>
            <ul className="bk-attention-list">
              {home.attention.map((line, i) => (
                <li key={`${i}-${line}`}>{line}</li>
              ))}
            </ul>
          </section>
        )}
        {home.tiles.length > 0 ? (
          <div className="bk-tiles">
            {home.tiles.map((t, i) => (
              <StatTile key={`${i}-${t.label}`} label={t.label} value={t.value} {...(t.note !== undefined ? { note: t.note } : {})} />
            ))}
          </div>
        ) : (
          <p className="bk-note">Your backend is ready. More tools appear here as they’re added to your site.</p>
        )}
      </main>
    </>
  );
}
