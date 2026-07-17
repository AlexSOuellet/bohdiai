/**
 * Build the origin of a tenant's storefront from the dashboard's own host, so the
 * editor's live-preview iframe points at the real store. The dashboard runs on
 * `app.bohdiai.com` (prod) or `localhost` / `app.localhost` (dev); the storefront
 * for shop `sub` is `sub.bohdiai.com` over https in prod and `sub.localhost:PORT`
 * over http in dev. Deriving from the request host (rather than a fixed env)
 * keeps preview working across prod, preview deploys, and local dev.
 */
export function storefrontOrigin(subdomain: string, dashboardHost: string | null): string {
  const host = (dashboardHost ?? '').trim();
  const [hostname = '', port] = host.split(':');

  // Local dev: any *.localhost (or bare localhost) → http, keep the port.
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    const suffix = port ? `:${port}` : '';
    return `http://${subdomain}.localhost${suffix}`;
  }

  // Production / preview: the shop lives one label under the apex over https.
  // Strip a leading `app.` (or any leading label) to get the apex.
  const apex = hostname.startsWith('app.') ? hostname.slice('app.'.length) : hostname;
  return `https://${subdomain}.${apex}`;
}

/** The full preview URL: the storefront home with a one-off look override applied
 *  (re-skins the public content only; see StorefrontPage). Optional moodKey renders
 *  the store in the feeling being tried on, so the preview reflects the whole family
 *  (section layout, wallpaper, nav), not just the skin. Optional textureUrl layers
 *  Editor Door 2's texture preview on top; optional textureOpacity (0–1) overrides
 *  the family's default opacity. */
export function previewUrl(origin: string, skinKey: string, textureUrl?: string | undefined, textureOpacity?: number | undefined, moodKey?: string | undefined): string {
  let url = `${origin}/?previewLook=${encodeURIComponent(skinKey)}`;
  if (moodKey !== undefined && moodKey !== '') {
    url += `&previewMood=${encodeURIComponent(moodKey)}`;
  }
  if (textureUrl !== undefined && textureUrl !== '') {
    url += `&previewTexture=${encodeURIComponent(textureUrl)}`;
  }
  if (textureOpacity !== undefined && Number.isFinite(textureOpacity)) {
    url += `&previewTextureOpacity=${textureOpacity.toFixed(2)}`;
  }
  return url;
}
