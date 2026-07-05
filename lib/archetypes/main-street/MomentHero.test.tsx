import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MomentHero, buildHeroTimeline, heroPhaseDurationMs } from './MomentHero';
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

describe('MomentHero (the hero IS the front door, D54 corrected)', () => {
  it('renders a full-screen hero with held media and the brand block landed at rest', () => {
    const { container } = render(<MomentHero identity={identity} moment={moment} skin={skin} />);
    expect(container.querySelector('[data-ms-hero]')).toBeTruthy();
    expect(container.querySelector('video')).toBeTruthy();
    expect(container.querySelector('[data-ms-hero-brand]')).toBeTruthy();
  });

  it('puts the authored story lines in the DOM (for the play-through to reveal one at a time) but renders them invisible at rest', () => {
    const { container } = render(<MomentHero identity={identity} moment={moment} skin={skin} />);
    const lines = container.querySelectorAll('[data-ms-hero-story-line]');
    expect(lines).toHaveLength(moment.story.length);
    expect(lines[0]!.textContent).toBe(moment.story[0]);
    expect(lines[1]!.textContent).toBe(moment.story[1]);
    // At rest the line frames are marked data-visible="false" — the CSS rule in
    // skinVarsCss keys visibility off that attribute, so a class-only frame has no
    // inline opacity; the story plays during the timeline, not as a static stack.
    const frames = container.querySelectorAll('[data-ms-hero-story-line-frame]');
    for (const f of frames) {
      expect((f as HTMLElement).getAttribute('data-visible')).toBe('false');
      expect((f as HTMLElement).className).toContain('ms-momenthero-frame');
    }
  });

  it('renders no story-line frames when no story lines are authored', () => {
    const noStory = { ...moment, story: [] };
    const { container } = render(<MomentHero identity={identity} moment={noStory} skin={skin} />);
    expect(container.querySelectorAll('[data-ms-hero-story-line]')).toHaveLength(0);
  });

  it('does NOT mount a portable Moment intro overlay (the portable layer retired in D54)', () => {
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
    expect(container.querySelector('img')).toBeTruthy();
    expect(container.querySelector('video')).toBeNull();
    // Class-only: the push-in animation is applied via the --push modifier on the
    // media frame; the CSS rule (in skinVarsCss) references the ms-hero-push keyframes.
    const mediaFrame = container.querySelector('.ms-momenthero-mediaframe');
    expect(mediaFrame).toBeTruthy();
    expect(mediaFrame!.className).toContain('ms-momenthero-mediaframe--push');
  });

  it('lets a real logo sit beside the typographic wordmark — a true lockup, not a replacement, and bare (no plate)', () => {
    const withLogo = { ...identity, logoUrl: 'https://cdn/logo.png' };
    const { container } = render(<MomentHero identity={withLogo} moment={moment} skin={skin} />);
    const logo = container.querySelector('img[data-ms-logo]') as HTMLImageElement | null;
    expect(logo?.getAttribute('src')).toBe('https://cdn/logo.png');
    expect(logo?.getAttribute('alt')).toBe('');
    expect(logo?.closest('.ms-logo-plate')).toBeNull();
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
    expect(style.includes('#F7F5F2') || style.includes('rgb(247, 245, 242)') || style.includes('rgb(247,245,242)')).toBe(true);
  });
});

describe('MomentHero hero timeline (the play-through, in the hero surface)', () => {
  it('builds: open → (line, gap) × N → brand', () => {
    const t = buildHeroTimeline(2);
    expect(t.map((p) => p.kind)).toEqual(['open', 'line', 'gap', 'line', 'gap', 'brand']);
    expect(t[1]).toEqual({ kind: 'line', index: 0 });
    expect(t[3]).toEqual({ kind: 'line', index: 1 });
  });

  it('with no story lines, the timeline is still valid (open → brand)', () => {
    const t = buildHeroTimeline(0);
    expect(t.map((p) => p.kind)).toEqual(['open', 'brand']);
  });

  it('the brand phase is terminal (null duration); non-terminal phases have positive durations', () => {
    expect(heroPhaseDurationMs({ kind: 'brand' })).toBeNull();
    expect(heroPhaseDurationMs({ kind: 'open' })!).toBeGreaterThan(0);
    expect(heroPhaseDurationMs({ kind: 'gap' })!).toBeGreaterThan(0);
    expect(heroPhaseDurationMs({ kind: 'line', index: 0 })!).toBeGreaterThan(0);
  });

  it('a gap is at least as long as the fade so two lines never share the screen', () => {
    // The fade is 0.9s (900ms). A gap holds for at least that, so one line is
    // fully out before the next is in.
    expect(heroPhaseDurationMs({ kind: 'gap' })!).toBeGreaterThanOrEqual(900);
  });
});
