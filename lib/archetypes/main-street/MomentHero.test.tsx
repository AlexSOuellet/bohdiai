import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, act, fireEvent } from '@testing-library/react';
import { MomentHero, MomentIntro, buildStoryTimeline, phaseDurationMs } from './MomentHero';
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

describe('buildStoryTimeline', () => {
  it('frames each line with a clean gap and lands on the brand — no two lines stack', () => {
    const t = buildStoryTimeline(2);
    expect(t.map((p) => p.kind)).toEqual(['open', 'line', 'gap', 'line', 'gap', 'brand']);
  });
});

describe('MomentHero (the rested hero)', () => {
  it('renders a full-screen hero with held media, a frame per story line, and a brand frame', () => {
    const { container } = render(<MomentHero identity={identity} moment={moment} skin={skin} />);
    expect(container.querySelector('[data-ms-hero]')).toBeTruthy();
    expect(container.querySelector('video')).toBeTruthy();
    expect(container.querySelectorAll('[data-story-line]')).toHaveLength(moment.story.length);
    expect(container.querySelector('[data-story-brand]')).toBeTruthy();
  });

  it('rests on the brand by default (no auto-play) and shows no intro overlay without a shop key', () => {
    const { container } = render(<MomentHero identity={identity} moment={moment} skin={skin} />);
    // The hero is already landed — the brand frame is visible at rest.
    const brand = container.querySelector('[data-story-brand]') as HTMLElement;
    expect(brand.style.opacity).toBe('1');
    // No momentKey → the cold-arrival overlay never mounts.
    expect(container.querySelector('[data-moment-intro]')).toBeNull();
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

  it('falls back to the goods scroll when the primary has no authored target', () => {
    const { getByText } = render(<MomentHero identity={identity} moment={moment} skin={skin} />);
    expect(getByText('See the loaves').closest('a')?.getAttribute('href')).toBe('#goods');
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

describe('MomentHero — spotlight kind', () => {
  it('uses SpotlightStage as the rested hero when moment.media.kind is spotlight', () => {
    const spotlightMoment = { ...moment, media: { ...moment.media, kind: 'spotlight' as const } };
    const { container } = render(<MomentHero identity={identity} moment={spotlightMoment} skin={skin} />);
    expect(container.querySelector('[data-spotlight-stage]')).not.toBeNull();
  });

  it('uses the existing MomentStage (no SpotlightStage) when moment.media.kind is video', () => {
    const { container } = render(<MomentHero identity={identity} moment={moment} skin={skin} />);
    expect(container.querySelector('[data-spotlight-stage]')).toBeNull();
  });
});

describe('MomentIntro — spotlight kind', () => {
  it('renders SpotlightStage inside the intro overlay for spotlight moments', () => {
    const spotlightMoment = { ...moment, media: { ...moment.media, kind: 'spotlight' as const } };
    const { container } = render(<MomentIntro moment={spotlightMoment} skin={skin} onExited={vi.fn()} />);
    expect(container.querySelector('[data-spotlight-stage]')).not.toBeNull();
    // Uses MomentStage shape selectors for non-spotlight so we check absence of story-line data attrs:
    expect(container.querySelector('[data-story-line]')).toBeNull();
  });

  it('holds the Enter button back until ~7500ms have elapsed for spotlight', async () => {
    vi.useFakeTimers();
    try {
      const spotlightMoment = { ...moment, media: { ...moment.media, kind: 'spotlight' as const } };
      const { container } = render(<MomentIntro moment={spotlightMoment} skin={skin} onExited={vi.fn()} />);
      // Button absent at t=0
      expect(container.querySelector('[data-moment-enter]')).toBeNull();
      // Advance to just before the gate (7499ms)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(7499);
      });
      expect(container.querySelector('[data-moment-enter]')).toBeNull();
      // Advance past the gate
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2);
      });
      expect(container.querySelector('[data-moment-enter]')).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('melts out on Enter click for spotlight and calls onExited after the fade', async () => {
    vi.useFakeTimers();
    try {
      const onExited = vi.fn();
      const spotlightMoment = { ...moment, media: { ...moment.media, kind: 'spotlight' as const } };
      const { container } = render(<MomentIntro moment={spotlightMoment} skin={skin} onExited={onExited} />);
      // Advance past the spotlight entry gate
      await act(async () => {
        await vi.advanceTimersByTimeAsync(7501);
      });
      const enterBtn = container.querySelector('[data-moment-enter]') as HTMLButtonElement;
      await act(async () => {
        enterBtn.click();
      });
      const overlay = container.querySelector('[data-moment-intro]') as HTMLElement;
      expect(overlay.style.opacity).toBe('0'); // melting
      expect(onExited).not.toHaveBeenCalled();
      await act(async () => {
        fireEvent.transitionEnd(overlay, { propertyName: 'opacity' });
      });
      expect(onExited).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('MomentIntro (the cold-arrival overlay)', () => {
  it('holds the Enter button back until the story has played and landed', async () => {
    vi.useFakeTimers();
    try {
      const onExited = vi.fn();
      const { container } = render(<MomentIntro moment={moment} skin={skin} onExited={onExited} />);
      // Before it lands, there is no way to enter.
      expect(container.querySelector('[data-moment-enter]')).toBeNull();

      // Advance phase by phase (each timeout schedules the next on its own commit).
      for (const phase of buildStoryTimeline(moment.story.length)) {
        const ms = phaseDurationMs(phase);
        if (ms === null) break; // brand is terminal
        await act(async () => {
          await vi.advanceTimersByTimeAsync(ms);
        });
      }
      const brand = container.querySelector('[data-story-brand]') as HTMLElement;
      expect(brand.style.opacity).toBe('1');
      expect(container.querySelector('[data-moment-enter]')).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('melts (fades out) on Enter and calls onExited once the fade finishes', async () => {
    vi.useFakeTimers();
    try {
      const onExited = vi.fn();
      const { container } = render(<MomentIntro moment={moment} skin={skin} onExited={onExited} />);
      for (const phase of buildStoryTimeline(moment.story.length)) {
        const ms = phaseDurationMs(phase);
        if (ms === null) break;
        await act(async () => {
          await vi.advanceTimersByTimeAsync(ms);
        });
      }
      const enterBtn = container.querySelector('[data-moment-enter]') as HTMLButtonElement;
      await act(async () => {
        enterBtn.click();
      });
      const overlay = container.querySelector('[data-moment-intro]') as HTMLElement;
      expect(overlay.style.opacity).toBe('0'); // melting
      expect(onExited).not.toHaveBeenCalled(); // not until the fade completes

      await act(async () => {
        fireEvent.transitionEnd(overlay, { propertyName: 'opacity' });
      });
      expect(onExited).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
