'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { qrFileName, type QrTarget } from '@/lib/backend/qr/qr';

/** Big enough to print sharp on a market sign. */
const PNG_SIZE = 1200;
const OPTIONS = { errorCorrectionLevel: 'M', margin: 2, color: { dark: '#000000', light: '#ffffff' } } as const;

type Code = { svg: string; png: string } | { error: string } | null;

/** QR code: pick what it opens, see it, download it as a picture (PNG) or a
 *  file that stays sharp at any size (SVG). Made in the browser; nothing is saved. */
export function QrMaker({ targets, subdomain }: { targets: QrTarget[]; subdomain: string }): React.ReactElement {
  const [key, setKey] = useState(targets[0]?.key ?? '');
  const target = targets.find((t) => t.key === key) ?? targets[0];
  const [code, setCode] = useState<Code>(null);

  useEffect(() => {
    if (target === undefined) return;
    let live = true;
    Promise.all([QRCode.toString(target.url, { ...OPTIONS, type: 'svg' }), QRCode.toDataURL(target.url, { ...OPTIONS, width: PNG_SIZE })])
      .then(([svg, png]) => {
        if (live) setCode({ svg, png });
      })
      .catch(() => {
        if (live) setCode({ error: 'The code couldn’t be made. Refresh the page to try again.' });
      });
    return () => {
      live = false;
    };
  }, [target]);

  const svgHref = code !== null && 'svg' in code ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(code.svg)}` : null;

  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">QR code</h1>
      </div>
      <main id="main" className="bk-content">
        <section className="bk-section" aria-labelledby="s-qr">
          <h2 id="s-qr" className="bk-section-title">
            A code people can scan
          </h2>
          <p className="bk-note">Print it for your table, a sign or your cards. Scanning it with a phone camera opens the page you pick.</p>
          <div className="bk-field">
            <label className="bk-label" htmlFor="qr-target">
              Opens
            </label>
            <select id="qr-target" className="bk-input" value={target?.key ?? ''} onChange={(e) => setKey(e.target.value)}>
              {targets.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          {target !== undefined && <p className="bk-note bk-qr-url">{target.url}</p>}
          {code !== null && 'error' in code && (
            <p className="bk-notice" role="alert">
              {code.error}
            </p>
          )}
          {code !== null && 'png' in code && target !== undefined && (
            <div className="bk-qr">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="bk-qr-img" src={code.png} alt={`QR code that opens ${target.url}`} />
              <div className="bk-row">
                <a className="bk-btn" href={code.png} download={qrFileName(subdomain, target, 'png')}>
                  Download picture (PNG)
                </a>
                {svgHref !== null && (
                  <a className="bk-btn bk-btn-quiet" href={svgHref} download={qrFileName(subdomain, target, 'svg')}>
                    Download for printing large (SVG)
                  </a>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
