import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'BohdiAI — Your Business Online. Finally Made Easy.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 88px',
          background: '#f7f1e6',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontFamily: 'monospace',
            fontSize: 18,
            letterSpacing: '0.14em',
            color: '#56493b',
            textTransform: 'uppercase',
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: '#d99634',
            }}
          />
          BohdiAI · beta opening summer 2026
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          <div
            style={{
              fontSize: 96,
              lineHeight: 1.0,
              color: '#1f1a14',
              letterSpacing: '-0.025em',
              fontWeight: 300,
            }}
          >
            Your business online.
          </div>
          <div
            style={{
              fontSize: 96,
              lineHeight: 1.0,
              color: '#1f1a14',
              letterSpacing: '-0.025em',
              fontWeight: 300,
            }}
          >
            <span style={{ fontStyle: 'italic', color: '#bf7a1f' }}>Finally</span> made easy.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: 22,
            color: '#3a3127',
          }}
        >
          <div style={{ maxWidth: 720, lineHeight: 1.35 }}>
            A professional storefront for makers, bakers, vintage sellers and service providers —
            built by AI in minutes. You keep 100%.
          </div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 16,
              letterSpacing: '0.12em',
              color: '#56493b',
              textTransform: 'uppercase',
            }}
          >
            bohdiai.com
          </div>
        </div>
      </div>
    ),
    size,
  );
}
