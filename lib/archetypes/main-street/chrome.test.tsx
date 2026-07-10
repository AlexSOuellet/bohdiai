import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MainStreetRoot, MainStreetFooter, WordmarkLink, Nav, skinVarsCss, fluidFontSize, linkHref, LINK_TARGETS, resolveNav, MAIN_STREET_NAV } from './chrome';
import { MAIN_STREET_SKINS } from './skins';
import { relativeLuminance } from './logo-contrast';

const skin = MAIN_STREET_SKINS['main-street-ember']!;
afterEach(cleanup);

describe('linkHref', () => {
  it('maps each real-page target to a route that exists', () => {
    expect(linkHref('home')).toBe('/');
    expect(linkHref('shop')).toBe('/shop');
    expect(linkHref('about')).toBe('/about');
    expect(linkHref('events')).toBe('/events');
    expect(linkHref('contact')).toBe('/contact');
  });

  it('every target is a real route — no in-page scroll target (the home is a sampling; the shop is the catalog)', () => {
    for (const t of LINK_TARGETS) {
      expect(linkHref(t)).toMatch(/^\//);
    }
  });
});

describe('skinVarsCss', () => {
  it('emits both surfaces and the three font voices as CSS vars', () => {
    const css = skinVarsCss(skin);
    expect(css).toContain('--ms-bg:');
    expect(css).toContain('--ms-contrast-bg:');
    expect(css).toContain('--ms-contrast-fg:');
    expect(css).toContain('--ms-accent:');
    expect(css).toContain('--ms-disp:');
    expect(css).toContain('--ms-body:');
    expect(css).toContain('--ms-mono:');
  });

  it('emits each type role as CSS variables on the root (so the editor/families can retune type live)', () => {
    const css = skinVarsCss(skin);
    const brand = skin.type['brand']!;
    expect(css).toContain(`--ms-t-brand-family:${brand.family}`);
    expect(css).toContain('--ms-t-brand-size:clamp(');
    expect(css).toContain(`--ms-t-brand-weight:${brand.weight}`);
    expect(css).toContain(`--ms-t-brand-line:${brand.lineHeight}`);
    // a label role carries uppercase + tracking
    expect(css).toContain('--ms-t-navLabel-transform:uppercase');
    expect(css).toContain(`--ms-t-navLabel-tracking:${skin.type['navLabel']!.letterSpacing}`);
  });

  it('styles every data-type role off those variables — no inline font needed', () => {
    const css = skinVarsCss(skin);
    for (const role of Object.keys(skin.type)) {
      expect(css).toContain(`[data-type="${role}"]`);
      expect(css).toContain(`font-family:var(--ms-t-${role}-family)`);
      expect(css).toContain(`font-size:var(--ms-t-${role}-size)`);
    }
  });

  it('drives the role size from the fluid clamp (display shrinks on small screens)', () => {
    const css = skinVarsCss(skin);
    // the brand size var is the same fluid clamp fluidFontSize produces
    expect(css).toContain(`--ms-t-brand-size:${fluidFontSize(skin.type['brand']!.size, skin.type['brand']!.sizeMobile)}`);
  });

  it('tokenizes drop-shadows into an --ms-shadow var — no raw black-hex literals scattered in the CSS', () => {
    const css = skinVarsCss(skin);
    expect(css).toContain('--ms-shadow:');
    expect(css).toContain('var(--ms-shadow)');
    // the goods-treatment shadows must reference the token, not hardcode black
    expect(css).not.toMatch(/#0{6}[0-9a-fA-F]{2}/);
  });

  it('strengthens the shadow token on a dark skin (a black shadow vanishes on a dark surface)', () => {
    const lightSkin = Object.values(MAIN_STREET_SKINS).find((s) => relativeLuminance(s.palette.bg) > 0.5)!;
    const darkSkin = Object.values(MAIN_STREET_SKINS).find((s) => relativeLuminance(s.palette.bg) <= 0.5)!;
    const shadowOf = (css: string) => css.match(/--ms-shadow:[^;]+/)![0];
    expect(shadowOf(skinVarsCss(darkSkin))).not.toBe(shadowOf(skinVarsCss(lightSkin)));
  });

  it('marks the moment hero scrim pointer-events:none so it never intercepts CTA clicks (Session-66 regression)', () => {
    const css = skinVarsCss(skin);
    const scrimRule = css.match(/\.ms-momenthero-scrim\{[^}]+\}/)![0];
    expect(scrimRule).toContain('pointer-events:none');
  });

  it('caps the FloatingCard brand size so long shop names fit the narrow card at word boundaries (no mid-word breaks)', () => {
    // The global [data-type="brand"] rule sets max-width:18ch + overflow-wrap:
    // break-word, which is fine for wide heroes but breaks long single words
    // (e.g. "Lenticular") mid-character inside the FloatingCard's narrow
    // (max 460px) card. Live regression on lenticular-lumens caught this.
    const css = skinVarsCss(skin);
    const rule = css.match(/\.arch-main-street \.ms-float-card \[data-type="brand"\]\{[^}]+\}/)![0];
    expect(rule).toContain('font-size:clamp(');
    expect(rule).toContain('max-width:none');
  });

  it('styles the moment hero brand block for over-media legibility (Session-66 — CTAs replaced by caption)', () => {
    const css = skinVarsCss(skin);
    const subRule = css.match(/\.ms-momenthero-brand-sub\{[^}]+\}/)![0];
    const h1Rule = css.match(/\.ms-momenthero-brand-h1\{[^}]+\}/)![0];
    const eyebrowRule = css.match(/\.ms-momenthero-brand-eyebrow\{[^}]+\}/)![0];
    // The h1 keeps its cinematic soft shadow. Eyebrow + sub use full-opacity
    // cream (--ms-on-media, not --ms-on-media-muted) — the muted 74% variant
    // was what actually washed the eyebrow out on light heroes (Session 66
    // walkthrough on Classic Loafs bread crumb). Scale + tracking carry the
    // hierarchy, not opacity.
    // All four text elements read a softened variant of --ms-on-media via
    // color-mix (Session 66 A1 — Alex's "nudge everything down a hair" call
    // after the z-index fix landed). No element uses a hardcoded color; the
    // token still drives everything. Eyebrow deliberately no longer uses the
    // shared --ms-on-media-muted variable — its own soften percentage lives
    // inside color-mix so we don't have to tune the shared muted var and
    // affect other beats.
    expect(h1Rule).toMatch(/color:color-mix\([^)]*var\(--ms-on-media\)/);
    expect(h1Rule).toContain('text-shadow:');
    expect(subRule).toMatch(/color:color-mix\([^)]*var\(--ms-on-media\)/);
    expect(eyebrowRule).toMatch(/color:color-mix\([^)]*var\(--ms-on-media\)/);
    expect(eyebrowRule).not.toContain('var(--ms-on-media-muted)');
    // And the old CTA rules must be gone — no ghost / chip / accent chip to fail
    expect(css).not.toContain('.ms-momenthero-cta{');
    expect(css).not.toContain('.ms-momenthero-cta2');
  });
});

describe('fluidFontSize', () => {
  const minOf = (css: string) => Number(css.match(/clamp\((\d+(?:\.\d+)?)px/)![1]);

  it('returns a clamp() that tops out at the desktop size', () => {
    const css = fluidFontSize(84);
    expect(css.startsWith('clamp(')).toBe(true);
    expect(css.endsWith('84px)')).toBe(true);
  });

  it('shrinks large display type well below its desktop size on small screens', () => {
    expect(minOf(fluidFontSize(84))).toBeLessThan(84 * 0.6);
  });

  it('barely shrinks small label type', () => {
    const min = minOf(fluidFontSize(13));
    expect(min).toBeGreaterThanOrEqual(12);
    expect(min).toBeLessThanOrEqual(13);
  });

  it('honors an explicit sizeMobile as the floor', () => {
    expect(fluidFontSize(64, 28).startsWith('clamp(28px,')).toBe(true);
  });

  it('returns a plain px size when the floor meets the desktop size', () => {
    expect(fluidFontSize(12, 12)).toBe('12px');
  });
});

describe('resolveNav', () => {
  it('returns the platform nav — the fixed list of pages every storefront has (§1.7)', () => {
    expect(resolveNav()).toEqual(MAIN_STREET_NAV);
  });

  it('lists Shop, Collections, About, Events, Contact in reading order — Testimonials lives in the footer (Session 66 A3)', () => {
    const hrefs = resolveNav().map((n) => n.href);
    expect(hrefs).toEqual(['/shop', '/collections', '/about', '/events', '/contact']);
    expect(hrefs).not.toContain('/testimonials');
  });
});

describe('MainStreetRoot', () => {
  it('renders the scoped container and grain layer', () => {
    const { container } = render(
      <MainStreetRoot skin={skin}>
        <div>child</div>
      </MainStreetRoot>,
    );
    expect(container.querySelector('.arch-main-street')).toBeTruthy();
    expect(container.querySelector('.ms-grain')).toBeTruthy();
  });
});

describe('WordmarkLink — logo-contains-wordmark doubling fix', () => {
  it('shows BOTH the logo image and the text wordmark by default (pure mark logo)', () => {
    const { container, queryByText } = render(
      <WordmarkLink wordmark="Ember Candles" logoUrl="https://x/y.png" />,
    );
    expect(container.querySelector('img[data-ms-logo]')).toBeTruthy();
    expect(queryByText('Ember Candles')).toBeTruthy();
  });

  it('shows the text wordmark when there is NO logo at all', () => {
    const { container, queryByText } = render(<WordmarkLink wordmark="Ember Candles" />);
    expect(container.querySelector('img[data-ms-logo]')).toBeNull();
    expect(queryByText('Ember Candles')).toBeTruthy();
  });

  it('shows the text wordmark alongside the logo by default (lockup)', () => {
    // The dashboard will eventually let the maker choose logo-only when their
    // logo already contains the shop name; until then, default is always show both.
    const { container, queryByText } = render(
      <WordmarkLink wordmark="Ember Candles" logoUrl="https://x/wordmark-logo.png" />,
    );
    expect(container.querySelector('img[data-ms-logo]')).toBeTruthy();
    expect(queryByText('Ember Candles')).toBeTruthy();
  });
});

describe('Nav — split-center variant', () => {
  const baseIdentity = {
    wordmark: 'Ember Candles',
    nav: [
      { label: 'Shop', target: 'shop' as const },
      { label: 'About', target: 'about' as const },
      { label: 'Events', target: 'events' as const },
      { label: 'Contact', target: 'contact' as const },
    ],
  };

  it('renders the standard bar with no split grid by default', () => {
    const { container } = render(<Nav identity={baseIdentity} />);
    expect(container.querySelector('.ms-nav-split')).toBeNull();
    expect(container.querySelector('.ms-nav-links')).not.toBeNull();
  });

  it('centers the wordmark between two link groups when navVariant is split-center', () => {
    const { container, getByText } = render(<Nav identity={{ ...baseIdentity, navVariant: 'split-center' }} />);
    const split = container.querySelector('.ms-nav-split');
    const left = container.querySelector('.ms-nav-split-left');
    const right = container.querySelector('.ms-nav-split-right');
    expect(split).not.toBeNull();
    expect(left).not.toBeNull();
    expect(right).not.toBeNull();
    // links are split across BOTH sides, not stacked on one
    expect(left!.querySelectorAll('a').length).toBeGreaterThan(0);
    expect(right!.querySelectorAll('a').length).toBeGreaterThan(0);
    // the wordmark stands on its own between the groups, not inside either
    expect(getByText('Ember Candles')).toBeTruthy();
    expect(left!.textContent).not.toContain('Ember Candles');
    expect(right!.textContent).not.toContain('Ember Candles');
  });

  it('hides the links behind an always-on Menu trigger for the menu-reveal variant', () => {
    const { container, getByText } = render(<Nav identity={{ ...baseIdentity, navVariant: 'menu-reveal' }} />);
    // no inline desktop link row — the links live in the overlay
    expect(container.querySelector('.ms-nav-links')).toBeNull();
    // a word trigger, shown at all widths (not the mobile-only burger)
    expect(container.querySelector('.ms-nav-toggle--always')).not.toBeNull();
    expect(container.querySelector('.ms-menu-trigger')).not.toBeNull();
    expect(getByText('Menu')).toBeTruthy();
  });

  it('elevates the shop link to a filled CTA button for the cta-forward variant', () => {
    const { container } = render(<Nav identity={{ ...baseIdentity, navVariant: 'cta-forward' }} />);
    const cta = container.querySelector('.ms-nav-cta');
    expect(cta).not.toBeNull();
    expect(cta!.getAttribute('href')).toBe('/shop');
    // the other links stay plain — only one is elevated
    expect(container.querySelectorAll('.ms-nav-cta').length).toBe(1);
    expect(container.querySelectorAll('.ms-nav-links a').length).toBeGreaterThan(1);
  });

  it('marks the current-page link active, and only that one', () => {
    const { container } = render(<Nav identity={baseIdentity} currentHref="/about" />);
    const active = container.querySelector('.ms-nav-link--active');
    expect(active).not.toBeNull();
    expect(active!.getAttribute('href')).toBe('/about');
    expect(active!.getAttribute('aria-current')).toBe('page');
    expect(container.querySelectorAll('.ms-nav-link--active').length).toBe(1);
  });

  it('marks no link active on the home (no current page)', () => {
    const { container } = render(<Nav identity={baseIdentity} />);
    expect(container.querySelector('.ms-nav-link--active')).toBeNull();
  });
});

describe('MainStreetFooter', () => {
  it('renders the shop name and the platform-guaranteed legal links', () => {
    const { getByText, container } = render(<MainStreetFooter shopName="June's Sourdough" />);
    expect(getByText("June's Sourdough")).toBeTruthy();
    const links = Array.from(container.querySelectorAll('a')).map((a) => a.textContent);
    expect(links).toEqual(expect.arrayContaining(['Home', 'Privacy', 'Terms']));
  });

  it('carries the Testimonials link (Session 66 A3 — moved out of the top nav)', () => {
    const { container } = render(<MainStreetFooter shopName="June's Sourdough" />);
    const links = Array.from(container.querySelectorAll('a'));
    const testimonialsLink = links.find((a) => a.textContent === 'Testimonials');
    expect(testimonialsLink).toBeTruthy();
    expect(testimonialsLink!.getAttribute('href')).toBe('/testimonials');
  });
});
