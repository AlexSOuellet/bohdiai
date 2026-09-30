/** The backend's origin (app.<site host>) from the site's own origin. */
export function appOrigin(siteUrl: string): string {
  const u = new URL(siteUrl);
  if (!u.hostname.startsWith('app.')) u.hostname = `app.${u.hostname}`;
  return u.origin;
}
