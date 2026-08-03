/**
 * Preview-context params threaded from a storefront route into StorefrontPage.
 *
 * The editor/walk preview lives entirely in the iframe URL's query string, and
 * PreviewLinkForwarder (see PREVIEW_PARAM_KEYS) re-attaches those params onto every
 * in-store click. But a route only renders the DRAFT if it actually READS the token
 * and passes it down — the home route always did; the sub-pages did not, so a click
 * from the staged home page to /about (or /shop, /events, …) silently rendered the
 * LIVE published store. This is the shared parse so every route consumes the same set.
 */

/** The raw preview params a storefront route receives on its searchParams. */
export interface PreviewSearchParams {
  previewToken?: string;
  previewStill?: string;
  previewLook?: string;
  previewMood?: string;
  previewTexture?: string;
  previewTextureOpacity?: string;
}

/** The parsed props spread into StorefrontPage. */
export interface PreviewProps {
  previewToken: string | undefined;
  previewStill: boolean;
  previewLook: string | undefined;
  previewMood: string | undefined;
  previewTexture: string | undefined;
  previewTextureOpacity: number | undefined;
}

/** Parse the forwarded preview params off a route's searchParams. Absent params stay
 *  undefined (→ live store); a present token makes StorefrontPage render the draft. */
export function previewPropsFrom(sp: PreviewSearchParams): PreviewProps {
  return {
    previewToken: sp.previewToken,
    previewStill: sp.previewStill === '1',
    previewLook: sp.previewLook,
    previewMood: sp.previewMood,
    previewTexture: sp.previewTexture,
    previewTextureOpacity:
      sp.previewTextureOpacity !== undefined ? Number.parseFloat(sp.previewTextureOpacity) : undefined,
  };
}
