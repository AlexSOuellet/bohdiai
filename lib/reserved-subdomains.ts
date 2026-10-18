/**
 * Subdomains no shop can take: BohdiAI's own hosts, including the two marketing
 * arms makers.bohdiai.com and service.bohdiai.com (Alex, Session 107). The
 * middleware never looks these up as shops, and the builder refuses them.
 */
export const RESERVED_SUBDOMAINS = ['www', 'admin', 'app', 'learn', 'makers', 'service'] as const;

export function isReservedSubdomain(sub: string): boolean {
  return (RESERVED_SUBDOMAINS as readonly string[]).includes(sub.toLowerCase());
}
