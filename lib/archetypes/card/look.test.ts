import { describe, it, expect } from 'vitest';
import { MAIN_STREET_SKINS } from '../main-street/skins';
import { shorelineLook } from './look';

const saltmarsh = MAIN_STREET_SKINS['main-street-saltmarsh']!;

describe('shorelineLook', () => {
  it('turns the skin into the design’s colour settings, keyed by the skin', () => {
    const look = shorelineLook(saltmarsh, null);
    expect(look.key).toBe('main-street-saltmarsh');
    expect(look.css).toContain('.sl[data-look="main-street-saltmarsh"]{');
    // Saltmarsh's own skin holds the design's original colours.
    expect(look.css).toContain('--navy:#0E2633');
    expect(look.css).toContain('--rust:#8C3B2A');
    expect(look.css).toContain('--paper:#FDF9F0');
    expect(look.css).toContain('--ink-soft:#4C5A5F');
    expect(look.css).toContain('--btn-bg:#0E2633');
    expect(look.css).toContain("--display:'Bodoni Moda'");
    expect(look.seaVideo).toBeNull();
    expect(look.fontHref).toMatch(/^https:\/\/fonts\.googleapis\.com\//);
  });
  it('puts the site’s own photo behind the page, and a clip when it has one', () => {
    const look = shorelineLook(saltmarsh, { url: '/scenes/marsh.webp', focus: 'center 62%' });
    expect(look.css).toContain(".sl-sea{background-image:url('/scenes/marsh.webp');background-position:center 62%}");
    expect(look.css).not.toContain('.sl-sky--home::before');
    expect(shorelineLook(saltmarsh, { url: '/a.webp', focus: 'center', video: '/a.mp4' }).seaVideo).toBe('/a.mp4');
  });
  it('gives a dark photo light lettering and a soft shade behind the opening', () => {
    const look = shorelineLook(saltmarsh, { url: '/a.webp', focus: 'center', tone: 'dark' });
    expect(look.css).toContain('.sl-sky--home::before{');
    expect(look.css).toContain('.sl-name{color:#F3EFE6');
  });
  it('never lets a value close the rule', () => {
    const look = shorelineLook(saltmarsh, { url: "/a.webp');}body{display:none", focus: 'center;}x{' });
    expect(look.css).not.toContain('}body{');
    expect(look.css).not.toContain('}x{');
  });
});
