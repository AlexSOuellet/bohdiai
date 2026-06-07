import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { MomentHero, buildStoryTimeline } from './MomentHero';
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

describe('MomentHero', () => {
  it('renders a full-screen hero with held media, a frame per story line, and a brand frame', () => {
    const { container } = render(<MomentHero identity={identity} moment={moment} skin={skin} />);
    expect(container.querySelector('[data-ms-hero]')).toBeTruthy();
    expect(container.querySelector('video')).toBeTruthy();
    expect(container.querySelectorAll('[data-story-line]')).toHaveLength(moment.story.length);
    expect(container.querySelector('[data-story-brand]')).toBeTruthy();
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

  it('advances through the lines and lands on the brand frame', async () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<MomentHero identity={identity} moment={moment} skin={skin} />);
      // The sequence is a chain of effects: each phase's timeout fires, advances
      // to the next phase, which re-runs the effect and schedules the next
      // timeout. Each link needs its own React commit, so advance per-phase.
      // For a 2-line story: open, line, gap, line, gap -> brand.
      for (const ms of [600, 2000, 800, 2000, 800]) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(ms);
        });
      }
      const brand = container.querySelector('[data-story-brand]') as HTMLElement;
      expect(brand.style.opacity).toBe('1');
    } finally {
      vi.useRealTimers();
    }
  });
});
