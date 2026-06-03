import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { MomentHero } from './MomentHero';
import { MAIN_STREET_SKINS } from './skins';

const skin = MAIN_STREET_SKINS['main-street-ember']!;
const identity = { wordmark: "June's Sourdough", nav: ['Shop', 'About'] };
const moment = {
  media: { kind: 'video' as const, prompt: 'Steam rising off a cracked crust, slow', url: '/bread-kling.mp4', alt: 'A loaf cooling' },
  story: ['It starts the night before', 'Pulled from the oven at first light'],
  eyebrow: 'Baked fresh every morning',
  brand: "June's Sourdough",
  ctaLabel: 'See the loaves',
};

afterEach(cleanup);

describe('MomentHero', () => {
  it('renders a full-screen hero with held media, a frame per story line, and a brand frame', () => {
    const { container } = render(<MomentHero identity={identity} moment={moment} skin={skin} />);
    expect(container.querySelector('[data-ms-hero]')).toBeTruthy();
    expect(container.querySelector('video')).toBeTruthy();
    expect(container.querySelectorAll('[data-story-line]')).toHaveLength(moment.story.length);
    expect(container.querySelector('[data-story-brand]')).toBeTruthy();
  });

  it('advances through the lines and lands on the brand frame', async () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<MomentHero identity={identity} moment={moment} skin={skin} />);
      // The sequence is a chain of effects: each step's timeout fires, sets the
      // next step, which re-runs the effect and schedules the next timeout. Each
      // link needs its own React commit, so advance in per-step flushes:
      // breath (900) then one hold (3400) per story line, plus one extra to land.
      for (const ms of [900, 3400, 3400, 3400]) {
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
