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

  it('shows the maker logo beside the wordmark when one is uploaded', () => {
    const withLogo = { ...identity, logoUrl: 'https://cdn/logo.png' };
    const { container } = render(<MomentHero identity={withLogo} moment={moment} skin={skin} />);
    const logo = container.querySelector('img[data-ms-logo]') as HTMLImageElement | null;
    expect(logo?.getAttribute('src')).toBe('https://cdn/logo.png');
  });

  it('shows no logo image when the maker uploaded none', () => {
    const { container } = render(<MomentHero identity={identity} moment={moment} skin={skin} />);
    expect(container.querySelector('img[data-ms-logo]')).toBeNull();
  });

  it('renders nav links to real routes — never a dead "#" placeholder', () => {
    const { container } = render(<MomentHero identity={identity} moment={moment} skin={skin} />);
    expect(container.querySelector('a[href="#"]')).toBeNull();
    expect(container.querySelector('a[href="/shop"]')).toBeTruthy();
    expect(container.querySelector('a[href="/about"]')).toBeTruthy();
    expect(container.querySelector('a[href="/cart"]')).toBeTruthy();
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
