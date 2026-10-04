import { describe, it, expect, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { CardMarquee } from './CardMarquee';

afterEach(cleanup);

describe('CardMarquee', () => {
  it('holds the band paused on a click or tap, and lets it go on the next', () => {
    const { container } = render(
      <CardMarquee>
        <div className="bc-marquee__row" />
      </CardMarquee>,
    );
    const band = container.querySelector('.bc-marquee') as HTMLElement;
    expect(band.getAttribute('aria-hidden')).toBe('true');
    expect(band.classList.contains('is-held')).toBe(false);
    fireEvent.click(band);
    expect(band.classList.contains('is-held')).toBe(true);
    fireEvent.click(band);
    expect(band.classList.contains('is-held')).toBe(false);
  });
});
