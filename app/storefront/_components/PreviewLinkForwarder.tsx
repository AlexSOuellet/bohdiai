'use client';

import { useEffect } from 'react';

/** The preview-context params the editor puts on the iframe URL. Any that are
 *  present on the current page get carried onto whatever the maker clicks to, so
 *  every in-store hop keeps rendering the staged draft (and the right look) until
 *  they leave the editor. Kept in one place so the storefront reads the same set. */
export const PREVIEW_PARAM_KEYS = [
  'previewToken',
  'previewLook',
  'previewMood',
  'previewTexture',
  'previewTextureOpacity',
  'previewStill',
] as const;

/**
 * Rendered only inside the editor preview (see StorefrontPage). The entire preview
 * context lives in the iframe's query string; a bare in-store link (`/shop`,
 * `/?intro=1`, the wordmark) carries none of it, so without this the next page
 * would render the LIVE published store. This attaches a capture-phase click
 * listener that re-attaches the current page's preview params onto same-origin
 * navigations and does a full navigation, so the draft survives every hop.
 *
 * Capture phase + stopPropagation runs before Next's <Link> bubble handler, so it
 * works for both <Link> and plain <a>. Params are read from location.search at
 * click time (not mount), so multi-hop stays correct. Nothing leaks to other tabs:
 * the context is only ever in this iframe's URL, never a cookie. Renders a hidden
 * marker so the storefront can assert it mounted; otherwise invisible.
 */
export function PreviewLinkForwarder({ navigate }: { navigate?: (url: string) => void }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const go = navigate ?? ((url: string) => window.location.assign(url));

    const onClick = (event: MouseEvent) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target !== '' && anchor.target !== '_self') return; // _blank / named target

      const dest = new URL(anchor.href, window.location.href);
      if (dest.origin !== window.location.origin) return; // external
      if (dest.pathname === window.location.pathname && dest.hash !== '') return; // same-page anchor

      const current = new URLSearchParams(window.location.search);
      for (const key of PREVIEW_PARAM_KEYS) {
        const value = current.get(key);
        if (value !== null) dest.searchParams.set(key, value);
      }

      event.preventDefault();
      event.stopPropagation();
      go(dest.toString());
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [navigate]);

  return <span data-preview-nav="" hidden />;
}
