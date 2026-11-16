import Link from 'next/link';
import type { Route } from 'next';
import type { SiteReport } from '@/lib/site-reports/load';
import { REASON_NAMES } from '@/lib/site-reports/tell';
import { statusName } from '@/lib/founder/sites';
import { shortDate } from '../format';

/** Every report, newest first: the site, why, what they said, and the way to suspend it. */
export function ReportList({ reports }: { reports: readonly SiteReport[] }): React.ReactElement {
  if (reports.length === 0)
    return (
      <p className="bk-note">
        No reports yet. When someone uses “Report this site” at the bottom of a site, it shows here
        and you get an email.
      </p>
    );
  return (
    <ul className="fd-messages">
      {reports.map((r) => (
        <li key={r.id} className="fd-message">
          <p className="fd-message-from">
            <span>
              <strong>{r.siteName}</strong> {r.subdomain === '' ? '' : `${r.subdomain}.bohdiai.com`}{' '}
              {r.status !== '' && (
                <span className="bk-pill" data-status={r.status}>
                  {statusName(r.status)}
                </span>
              )}
            </span>
            <span>{shortDate(r.sent)}</span>
          </p>
          <p className="bk-note">{REASON_NAMES[r.reason]}</p>
          <p className="fd-message-text">{r.details}</p>
          <p className="bk-note">
            {r.email === '' ? 'No email left.' : `Reply to: ${r.email}`}
            {r.subdomain !== '' && (
              <>
                {' · '}
                <Link href={`/founder/act/${r.tenantId}#suspend` as Route} className="bk-link">
                  {r.status === 'suspended' ? 'See the site' : 'Look at the site, or suspend it'}
                </Link>
              </>
            )}
          </p>
        </li>
      ))}
    </ul>
  );
}
