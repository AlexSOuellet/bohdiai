import { dollars, planName, statusName, type FounderSite } from '@/lib/founder/sites';
import { shortDate } from './format';

const FREE_NAMES: Record<string, string> = { free: 'Free site', showcase: 'Free Showcase' };

function paying(site: FounderSite): string {
  if (site.paying !== null) return `${dollars(site.paying.cents)} a ${site.paying.interval}`;
  return site.planComp === null ? 'Nothing' : (FREE_NAMES[site.planComp] ?? site.planComp);
}

/** Every site, newest first. A draft has no public address to open. */
export function SiteTable({ sites }: { sites: readonly FounderSite[] }): React.ReactElement {
  return (
    <div className="bk-table-wrap">
      <table className="bk-table">
        <thead>
          <tr>
            <th scope="col">Site</th>
            <th scope="col">Plan</th>
            <th scope="col">State</th>
            <th scope="col">Maker</th>
            <th scope="col">Pays</th>
            <th scope="col">Started</th>
          </tr>
        </thead>
        <tbody>
          {sites.map((site) => (
            <tr key={site.id}>
              <td>
                <span className="fd-site">{site.name}</span>
                {site.status === 'draft' ? (
                  <span className="fd-address">{site.subdomain}.bohdiai.com</span>
                ) : (
                  <a className="fd-address" href={`https://${site.subdomain}.bohdiai.com`} target="_blank" rel="noreferrer">
                    {site.subdomain}.bohdiai.com
                  </a>
                )}
              </td>
              <td>{planName(site.plan)}</td>
              <td>
                <span className="bk-pill" data-status={site.status}>
                  {statusName(site.status)}
                </span>
              </td>
              <td>{site.maker ?? 'Just you'}</td>
              <td>{paying(site)}</td>
              <td>{shortDate(site.joined)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
