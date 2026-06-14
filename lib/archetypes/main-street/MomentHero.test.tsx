import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MomentHero } from './MomentHero';
import { MAIN_STREET_SKINS } from './skins';

const skin = MAIN_STREET_SKINS['main-street-ember']!;
const identity = { wordmark: "June's Sourdough", nav: ['Shop', 'About'] };
const moment = {
  media: {
    kind: 'video' as const,
    prompt: {
      composition: 'tight overhead on a cracked loaf',
      subject: 'steam rising slowly off the crust',
      environment: 'a warm kitchen bench',
      atmosphere: 'quiet and unhurried',
      camera: 'locked off, shallow depth',
      lighting: 'soft golden window light',
      style: 'photographic, filmic grain',
    },
    url: '/bread-kling.mp4',
    alt: 'A loaf cooling',
  },
  story: ['It starts the night before', 'Pulled from the oven at first light'],
  eyebrow: 'Baked fresh every morning',
  brand: "June's Sourdough",
  ctaLabel: 'See the loaves',
};

afterEach(cleanup);

describe('MomentHero (the hero IS the front door, D54)', () => {
  it('renders a full-screen hero with held media and the brand block landed at rest', () => {
    const { container } = render(<MomentHero identity={identity} moment={moment} skin={skin} />);
    expect(container.querySelector('[data-ms-hero]')).toBeTruthy();
    expect(container.querySelector('video')).toBeTruthy();
    expect(container.querySelector('[data-ms-hero-brand]')).toBeTruthy();
  });

  it('renders the authored story lines as a subhead stack beneath the brand', () => {
    const { container } = render(<MomentHero identity={identity} moment={moment} skin={skin} />);
    const lines = container.querySelectorAll('[data-ms-hero-story-line]');
    expect(lines).toHaveLength(moment.story.length);
    expect(lines[0]!.textContent).toBe(moment.story[0]);
    expect(lines[1]!.textContent).toBe(moment.story[1]);
  });

  it('omits the story block when no story lines are authored', () => {
    const noStory = { ...moment, story: [] };
    const { container } = render(<MomentHero identity={identity} moment={noStory} skin={skin} />);
    expect(container.querySelector('[data-ms-hero-story]')).toBeNull();
  });

  it('does NOT mount a portable Moment intro overlay (the portable Moment layer retired in D54)', () => {
    const { container } = render(<MomentHero identity={identity} moment={moment} skin={skin} />);
    expect(container.querySelector('[data-moment-intro]')).toBeNull();
    expect(container.querySelector('[data-moment-enter]')).toBeNull();
    expect(container.querySelector('[data-spotlight-stage]')).toBeNull();
  });

  it('renders a STILL hero as an img with a very subtle CSS push-in (no fal-rendered camera motion)', () => {
    const stillMoment = {
      ...moment,
      media: { ...moment.media, kind: 'still' as const, url: '/scene.jpg' },
    };
    const { container } = render(<MomentHero identity={identity} moment={stillMoment} skin={skin} />);
    // a still asset renders as <img>, not <video> — fal returned a still
    expect(container.querySelector('img')).toBeTruthy();
    expect(container.querySelector('video')).toBeNull();
    // the push-in animation keyframes are emitted so the subtle motion has somewhere to live
    expect(container.innerHTML).toContain('ms-hero-push');
  });

  it('lets a real logo sit beside the typographic wordmark — a true lockup, not a replacement, and bare (no plate)', () => {
    const withLogo = { ...identity, logoUrl: 'https://cdn/logo.png' };
    const { container } = render(<MomentHero identity={withLogo} moment={moment} skin={skin} />);
    const logo = container.querySelector('img[data-ms-logo]') as HTMLImageElement | null;
    expect(logo?.getAttribute('src')).toBe('https://cdn/logo.png');
    // the image is decorative — the visible wordmark text carries the shop name
    expect(logo?.getAttribute('alt')).toBe('');
    // the logo is bare — no plate; the header surface handles contrast
    expect(logo?.closest('.ms-logo-plate')).toBeNull();
    // the typographic wordmark stays — the logo joins it, doesn't replace it
    const mark = container.querySelector('[data-type="wordmark"]') as HTMLElement;
    expect(mark.textContent).toContain("June's Sourdough");
  });

  it('falls back to the typographic wordmark when the maker uploaded no logo', () => {
    const { container } = render(<MomentHero identity={identity} moment={moment} skin={skin} />);
    expect(container.querySelector('img[data-ms-logo]')).toBeNull();
    const mark = container.querySelector('[data-type="wordmark"]') as HTMLElement;
    expect(mark.textContent).toContain("June's Sourdough");
  });

  it('renders nav links to real routes — never a dead "#" placeholder', () => {
    const { container } = render(<MomentHero identity={identity} moment={moment} skin={skin} />);
    expect(container.querySelector('a[href="#"]')).toBeNull();
    expect(container.querySelector('a[href="/shop"]')).toBeTruthy();
    expect(container.querySelector('a[href="/about"]')).toBeTruthy();
    expect(container.querySelector('a[href="/cart"]')).toBeTruthy();
  });

  it('sends the primary hero button to its authored target (D46)', () => {
    const m = { ...moment, ctaLabel: 'Our story', ctaTarget: 'about' as const };
    const { getByText } = render(<MomentHero identity={identity} moment={m} skin={skin} />);
    expect(getByText('Our story').closest('a')?.getAttribute('href')).toBe('/about');
  });

  it('falls back to /shop when the primary has no authored target (the catalog is the destination — the home is a sampling)', () => {
    const { getByText } = render(<MomentHero identity={identity} moment={moment} skin={skin} />);
    expect(getByText('See the loaves').closest('a')?.getAttribute('href')).toBe('/shop');
  });

  it('sends the secondary hero button to its authored target', () => {
    const m = { ...moment, secondaryCtaLabel: 'Find us', secondaryCtaTarget: 'events' as const };
    const { getByText } = render(<MomentHero identity={identity} moment={m} skin={skin} />);
    expect(getByText('Find us').closest('a')?.getAttribute('href')).toBe('/events');
  });

  it('falls back to /shop for a secondary button with no authored target', () => {
    const m = { ...moment, secondaryCtaLabel: 'Browse the shelf' };
    const { getByText } = render(<MomentHero identity={identity} moment={m} skin={skin} />);
    expect(getByText('Browse the shelf').closest('a')?.getAttribute('href')).toBe('/shop');
  });
});

describe('MomentHero — nav contrast (4c)', () => {
  it('gives the over-media nav a light surface for a dark logo (instead of staying transparent)', () => {
    const darkLogoIdentity = { ...identity, logoUrl: 'https://cdn/logo.png', logoTone: 'dark' as const };
    const { container } = render(<MomentHero identity={darkLogoIdentity} moment={moment} skin={skin} />);
    const nav = container.querySelector('[data-ms-nav]')!;
    const style = nav.getAttribute('style') ?? '';
    // dark logo + dark media backdrop → light surface (#F7F5F2 or rgb equivalent)
    expect(style.includes('#F7F5F2') || style.includes('rgb(247, 245, 242)') || style.includes('rgb(247,245,242)')).toBe(true);
  });
});
