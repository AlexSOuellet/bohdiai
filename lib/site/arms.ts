/**
 * bohdiai.com is the maker site itself (Alex, Session 117). The two marketing
 * arms it had since Session 107, makers.bohdiai.com and service.bohdiai.com,
 * now forward there. The service page's code stays (app/contractors), switched
 * off: nothing reaches it until it comes back in some form.
 */
export type Arm = 'makers' | 'service';

/** The arms' own pages on the parent, both forwarded home now. */
const OLD_PAGES = ['/makers', '/contractors'] as const;

const BASE_HOSTS = ['bohdiai.com', 'localhost'] as const;
const ARM_NAMES: readonly Arm[] = ['makers', 'service'];

function bareHost(hostname: string): string {
  return (hostname.split(':')[0] ?? '').toLowerCase();
}

/** The arm a host served (makers.bohdiai.com, makers.localhost), or null. */
export function armForHost(hostname: string): Arm | null {
  const host = bareHost(hostname);
  for (const arm of ARM_NAMES) {
    if (BASE_HOSTS.some((base) => host === `${arm}.${base}`)) return arm;
  }
  return null;
}

/** True on bohdiai.com itself (or plain localhost). */
function isParentHost(hostname: string): boolean {
  const host = bareHost(hostname);
  return host === 'bohdiai.com' || host === 'localhost';
}

/** bohdiai.com's origin as seen from an arm's host: local stays local, port included. */
function parentOrigin(url: URL, hostname: string): string {
  if (bareHost(hostname).endsWith('localhost')) return `${url.protocol}//localhost${url.port === '' ? '' : `:${url.port}`}`;
  return 'https://bohdiai.com';
}

export type ArmRoute = { kind: 'redirect'; url: string };

/**
 * How the middleware answers a marketing request, or null to pass it through.
 * An arm's host forwards to the same address on bohdiai.com (its own `/`, the
 * arm's page, goes to bohdiai.com's `/`). On bohdiai.com, the arms' old pages
 * (/makers, /contractors) and the retired samples page (/samples, Session 108)
 * forward to the maker page and the looks.
 */
export function armRoute(hostname: string, url: URL): ArmRoute | null {
  const arm = armForHost(hostname);
  if (arm !== null) {
    const path = (OLD_PAGES as readonly string[]).includes(url.pathname) ? '/' : url.pathname === '/samples' ? '/looks' : url.pathname;
    return { kind: 'redirect', url: `${parentOrigin(url, hostname)}${path}${url.search}` };
  }
  if (!isParentHost(hostname)) return null;
  if (url.pathname === '/samples') return { kind: 'redirect', url: `${url.protocol}//${url.host}/looks${url.search}` };
  if ((OLD_PAGES as readonly string[]).includes(url.pathname)) return { kind: 'redirect', url: `${url.protocol}//${url.host}/${url.search}` };
  return null;
}
