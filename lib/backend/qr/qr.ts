/**
 * QR codes — what a code can open: the site's home, its shop (when it sells), or
 * one live product. Pure; the page loads the products and the site's address.
 */
import { QR_PARAM } from '@/lib/visits/page-view';

export type QrTarget = { key: string; label: string; url: string };

/** Every printed code carries the QR flag, so a visit from one is counted as "Your QR codes". */
const FROM_QR = `?${QR_PARAM}=1`;

export function qrTargets(
  origin: string,
  opts: { shop: boolean; products: readonly { slug: string; name: string }[] },
): QrTarget[] {
  return [
    { key: 'home', label: 'Your home page', url: `${origin}/${FROM_QR}` },
    ...(opts.shop ? [{ key: 'shop', label: 'Your shop page', url: `${origin}/shop${FROM_QR}` }] : []),
    ...opts.products.map((p) => ({ key: `p:${p.slug}`, label: p.name, url: `${origin}/listings/${encodeURIComponent(p.slug)}${FROM_QR}` })),
  ];
}

/** "rose-n-cat-qr-theo.png": a file name that says what the code opens. */
export function qrFileName(subdomain: string, target: QrTarget, ext: 'png' | 'svg'): string {
  const what = target.key === 'home' ? '' : `-${target.key.replace(/^p:/, '')}`;
  return `${subdomain}-qr${what}.${ext}`;
}
