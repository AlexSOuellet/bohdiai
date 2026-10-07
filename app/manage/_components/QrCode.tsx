'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/** Big enough to print sharp on a market sign. */
const PNG_SIZE = 1200;
const OPTIONS = { errorCorrectionLevel: 'M', margin: 2, color: { dark: '#000000', light: '#ffffff' } } as const;

type Code = { svg: string; png: string } | { error: string } | null;

/** A QR code for `url`, shown and offered as a picture (PNG) or a file that stays
 *  sharp at any size (SVG). Made in the browser; nothing is saved. */
export function QrCode({ url, fileBase }: { url: string; fileBase: string }): React.ReactElement {
  const [code, setCode] = useState<Code>(null);

  useEffect(() => {
    let live = true;
    Promise.all([QRCode.toString(url, { ...OPTIONS, type: 'svg' }), QRCode.toDataURL(url, { ...OPTIONS, width: PNG_SIZE })])
      .then(([svg, png]) => {
        if (live) setCode({ svg, png });
      })
      .catch(() => {
        if (live) setCode({ error: 'The code couldn’t be made. Refresh the page to try again.' });
      });
    return () => {
      live = false;
    };
  }, [url]);

  if (code === null) return <p className="bk-note">Making the code…</p>;
  if ('error' in code) {
    return (
      <p className="bk-notice" role="alert">
        {code.error}
      </p>
    );
  }
  return (
    <div className="bk-qr">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="bk-qr-img" src={code.png} alt={`QR code that opens ${url}`} />
      <div className="bk-row">
        <a className="bk-btn" href={code.png} download={`${fileBase}.png`}>
          Download picture (PNG)
        </a>
        <a className="bk-btn bk-btn-quiet" href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(code.svg)}`} download={`${fileBase}.svg`}>
          Download for printing large (SVG)
        </a>
      </div>
    </div>
  );
}
