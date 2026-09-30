import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { VideoTile } from './VideoTile';
import { CONTRACTOR_STRINGS as S } from './strings';
import { PLAYBACK_RATE } from './SlowVideo';

// jsdom has no media playback — stand in for play()/pause() on the element.
const play = vi.fn<() => Promise<void>>();
const pause = vi.fn<() => void>();

beforeEach(() => {
  play.mockReset().mockResolvedValue(undefined);
  pause.mockReset();
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(play);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(pause);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const MEDIA = { kind: 'video' as const, url: 'https://cdn.example/job.mp4', poster: 'https://cdn.example/job.jpg', alt: 'Regrading a driveway' };

function tile() {
  render(<VideoTile media={MEDIA} />);
  return screen.getByRole('button');
}

describe('VideoTile', () => {
  it('rests still: poster + play mark, labelled as a play control, nothing autoplays', () => {
    const btn = tile();
    expect(btn.getAttribute('data-playing')).toBe('false');
    expect(btn.getAttribute('aria-pressed')).toBe('false');
    expect(btn.getAttribute('aria-label')).toBe(`${S.playVideo}: ${MEDIA.alt}`);
    const video = btn.querySelector('video')!;
    expect(video.getAttribute('src')).toBe(MEDIA.url);
    expect(video.getAttribute('poster')).toBe(MEDIA.poster);
    expect(video.getAttribute('preload')).toBe('none');
    expect(video.playbackRate).toBe(PLAYBACK_RATE);
    expect(play).not.toHaveBeenCalled();
  });

  it('plays on hover and stops on leave', async () => {
    const btn = tile();
    fireEvent.mouseEnter(btn);
    await waitFor(() => expect(btn.getAttribute('data-playing')).toBe('true'));
    expect(btn.getAttribute('aria-label')).toBe(`${S.pauseVideo}: ${MEDIA.alt}`);
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    fireEvent.mouseLeave(btn);
    expect(pause).toHaveBeenCalledTimes(1);
    expect(btn.getAttribute('data-playing')).toBe('false');
  });

  it('plays on keyboard focus and stops on blur', async () => {
    const btn = tile();
    fireEvent.focus(btn);
    await waitFor(() => expect(btn.getAttribute('data-playing')).toBe('true'));
    fireEvent.blur(btn);
    expect(pause).toHaveBeenCalledTimes(1);
    expect(btn.getAttribute('data-playing')).toBe('false');
  });

  it('toggles on tap: first tap plays, second tap pauses', async () => {
    const btn = tile();
    fireEvent.click(btn);
    await waitFor(() => expect(btn.getAttribute('data-playing')).toBe('true'));
    expect(play).toHaveBeenCalledTimes(1);
    fireEvent.click(btn);
    expect(pause).toHaveBeenCalledTimes(1);
    expect(btn.getAttribute('data-playing')).toBe('false');
  });

  it('stays in the resting state when the browser refuses to play (autoplay policy)', async () => {
    play.mockRejectedValue(new DOMException('blocked', 'NotAllowedError'));
    const btn = tile();
    fireEvent.click(btn);
    await waitFor(() => expect(play).toHaveBeenCalledTimes(1));
    // Let the rejected promise settle.
    await Promise.resolve();
    await Promise.resolve();
    expect(btn.getAttribute('data-playing')).toBe('false');
    expect(btn.getAttribute('aria-label')).toBe(`${S.playVideo}: ${MEDIA.alt}`);
  });
});
