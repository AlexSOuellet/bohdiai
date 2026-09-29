import { ImageResponse } from 'next/og';

export const alt = 'BohdiAI: If you make it, bake it, fix it or fund it, we build it for you';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// next/og renders from style objects only — the one place in the app styles are written this way.
// It also requires display:flex on any box with more than one child.
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
          background: '#0a0805',
          backgroundImage:
            'radial-gradient(ellipse 900px 420px at 50% 115%, rgba(243,201,122,0.42), rgba(233,161,61,0.14) 45%, rgba(10,8,5,0) 75%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 18,
            letterSpacing: '0.16em',
            color: '#f3c97a',
            textTransform: 'uppercase',
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: '#e9a13d',
              boxShadow: '0 0 18px #e9a13d',
            }}
          />
          BohdiAI · Websites for makers, contractors &amp; charities
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 76, lineHeight: 1.05, color: '#f3ede0', letterSpacing: '-0.03em', fontWeight: 500 }}>
            If you make it, bake it, fix it or fund it,
          </div>
          <div style={{ fontSize: 76, lineHeight: 1.05, color: '#f3c97a', letterSpacing: '-0.03em', fontWeight: 500 }}>
            we build it for you
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: 22,
            color: '#d8d2c4',
          }}
        >
          <div style={{ display: 'flex', maxWidth: 760, lineHeight: 1.35 }}>
            Real websites for small makers, local service businesses and charities. You keep every dollar.
          </div>
          <div style={{ display: 'flex', fontSize: 18, letterSpacing: '0.12em', color: '#8a8070', textTransform: 'uppercase' }}>
            bohdiai.com
          </div>
        </div>
      </div>
    ),
    size,
  );
}
