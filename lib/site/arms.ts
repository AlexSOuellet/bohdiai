/**
 * bohdiai.com is the parent; each audience has its own marketing arm on its own
 * host (Alex, Session 107): makers.bohdiai.com (pushed first) and
 * service.bohdiai.com (complete, quiet until pushed). An arm's home is the page
 * built at `page`; every other path (/start, /looks, /faq, /privacy) is the same
 * page on any host.
 */
import type { Audience } from './plans';

export type Arm = 'makers' | 'service';

export const ARMS: Record<Arm, { page: '/makers' | '/contractors'; audience: Audience }> = {
  makers: { page: '/makers', audience: 'maker' },
  service: { page: '/contractors', audience: 'contractor' },
};

export const ARM_FOR_AUDIENCE: Record<Audience, Arm> = { maker: 'makers', contractor: 'service' };

const BASE_HOSTS = ['bohdiai.com', 'localhost'] as const;

function bareHost(hostname: string): string {
  return (hostname.split(':')[0] ?? '').toLowerCase();
}

/** The arm a host serves (makers.bohdiai.com, makers.localhost), or null. */
export function armForHost(hostname: string): Arm | null {
  const host = bareHost(hostname);
  for (const arm of Object.keys(ARMS) as Arm[]) {
    if (BASE_HOSTS.some((base) => host === `${arm}.${base}`)) return arm;
  }
  return null;
}

/** True on bohdiai.com itself (or plain localhost). */
function isParentHost(hostname: string): boolean {
  const host = bareHost(hostname);
  return host === 'bohdiai.com' || host === 'localhost';
}

export type SiteTarget = Arm | 'parent';

/**
 * The origin of the parent or an arm, as seen from where the visitor is: on this
 * computer (anything.localhost) it stays local, port included; everywhere else
 * it is the live bohdiai.com address.
 */
export function siteOrigin(to: SiteTarget, from?: { protocol: string; hostname: string; port: string }): string {
  const sub = to === 'parent' ? '' : `${to}.`;
  if (from !== undefined && bareHost(from.hostname).endsWith('localhost')) {
    return `${from.protocol}//${sub}localhost${from.port === '' ? '' : `:${from.port}`}`;
  }
  return `https://${sub}bohdiai.com`;
}

export type ArmRoute = { kind: 'rewrite'; pathname: string } | { kind: 'redirect'; url: string };

/**
 * How the middleware answers a marketing request, or null to pass it through.
 * On an arm, `/` shows the arm's page and the page's own path folds back to `/`.
 * On the parent, the old /makers and /contractors addresses move to their arm,
 * so each page has one address.
 */
export function armRoute(hostname: string, url: URL): ArmRoute | null {
  const arm = armForHost(hostname);
  if (arm !== null) {
    const { page } = ARMS[arm];
    if (url.pathname === '/') return { kind: 'rewrite', pathname: page };
    if (url.pathname === page) return { kind: 'redirect', url: `${url.protocol}//${url.host}/${url.search}` };
    return null;
  }
  if (isParentHost(hostname)) {
    for (const a of Object.keys(ARMS) as Arm[]) {
      if (url.pathname === ARMS[a].page) {
        const origin = siteOrigin(a, { protocol: url.protocol, hostname, port: url.port });
        return { kind: 'redirect', url: `${origin}/${url.search}` };
      }
    }
  }
  return null;
}
