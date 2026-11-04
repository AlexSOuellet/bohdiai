import Link from 'next/link';
import type { Route } from 'next';
import { dollars, planName, statusName, type FounderSite } from '@/lib/founder/sites';
import { shortDate } from './format';

const FREE_NAMES: Record<string, string> = { free: 'Free site', showcase: 'Free Showcase' };

function paying(site: FounderSite): string {
  if (site.paying !== null) return `${dollars(site.paying.cents)} a ${site.paying.interval}${site.discount === null ? '' : ` (${site.discount})`}`;
  return site.planComp === null ? 'Nothing' : (FREE_NAMES[site.planComp] ?? site.planComp);
}

/** Every site, newest first, with the way into each: the site itself (a private
 *  link when it isn't live) and its backend. */
export function SiteTable({ sites }: { sites: readonly (FounderSite & { openUrl: string })[] }): React.ReactElement {
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
            <th scope="col">Backend</th>
          </tr>
        </thead>
        <tbody>
          {sites.map((site) => (
            <tr key={site.id}>
              <td>
                <span className="fd-site">{site.name}</span>
                <a className="fd-address" href={site.openUrl} target="_blank" rel="noreferrer">
                  {site.subdomain}.bohdiai.com
                </a>
              </td>
              <td>{planName(site.plan)}</td>
              <td>
                <span className="bk-pill" data-status={site.status}>
                  {statusName(site.status)}
                </span>
              </td>
              <td>{site.maker ?? 'Just you'}</td>
              <td>
                <Link href={`/founder/act/${site.id}` as Route} className="bk-link" aria-label={`Change what ${site.name} pays: ${paying(site)}`}>
                  {paying(site)}
                </Link>
              </td>
              <td>{shortDate(site.joined)}</td>
              <td>
                {site.canManage ? (
                  <form action="/manage/switch-site" method="post">
                    <input type="hidden" name="tenantId" value={site.id} />
                    <button type="submit" className="fd-out" aria-label={`Open the backend of ${site.name}`}>
                      Open
                    </button>
                  </form>
                ) : (
                  'Not on this site'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
