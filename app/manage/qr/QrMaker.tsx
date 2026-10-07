'use client';

import { useState } from 'react';
import { qrFileName, type QrTarget } from '@/lib/backend/qr/qr';
import { QrCode } from '../_components/QrCode';

/** QR code: pick what it opens, see it, download it as a picture (PNG) or a
 *  file that stays sharp at any size (SVG). Made in the browser; nothing is saved. */
export function QrMaker({ targets, subdomain }: { targets: QrTarget[]; subdomain: string }): React.ReactElement {
  const [key, setKey] = useState(targets[0]?.key ?? '');
  const target = targets.find((t) => t.key === key) ?? targets[0];
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
          {target !== undefined && <QrCode url={target.url} fileBase={qrFileName(subdomain, target, 'png').replace(/\.png$/, '')} />}
        </section>
      </main>
    </>
  );
}
