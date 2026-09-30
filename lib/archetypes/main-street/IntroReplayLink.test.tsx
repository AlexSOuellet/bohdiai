import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { IntroReplayLink } from './IntroReplayLink';
import { REPLAY_INTRO_EVENT } from './moment-gate';

afterEach(cleanup);

describe('IntroReplayLink', () => {
  it('links to the home page with the intro flag, carrying the class and style it is given', () => {
    render(
      <IntroReplayLink className="ms-footer-link" style={{ opacity: 0.5 }}>
        Intro
      </IntroReplayLink>,
    );
    const link = screen.getByRole('link', { name: 'Intro' });
    expect(link.getAttribute('href')).toBe('/?intro=1');
    expect(link.getAttribute('data-type')).toBe('legal');
    expect(link.className).toBe('ms-footer-link');
    expect(link.getAttribute('style')).toContain('opacity: 0.5');
  });

  it('adds no empty class or style attribute when none is given', () => {
    render(<IntroReplayLink>Intro</IntroReplayLink>);
    const link = screen.getByRole('link', { name: 'Intro' });
    expect(link.hasAttribute('class')).toBe(false);
    expect(link.hasAttribute('style')).toBe(false);
  });

  it('fires the replay event on click so an already-mounted home hero replays', () => {
    const onReplay = vi.fn();
    window.addEventListener(REPLAY_INTRO_EVENT, onReplay);
    try {
      render(<IntroReplayLink>Intro</IntroReplayLink>);
      fireEvent.click(screen.getByRole('link', { name: 'Intro' }));
      expect(onReplay).toHaveBeenCalledTimes(1);
    } finally {
      window.removeEventListener(REPLAY_INTRO_EVENT, onReplay);
    }
  });
});
