import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MarqueeBeat } from './MarqueeBeat';
import { MAIN_STREET_SKINS } from './skins';
import type { MarqueeLines } from './marquee';

const skin = MAIN_STREET_SKINS['main-street-ember']!;
const lines: MarqueeLines = {
  voice: ['Made in the workshop', 'Built to outlast us'],
  info: ['Riverside Market · Sat 9am'],
};

afterEach(cleanup);

describe('MarqueeBeat', () => {
  it('renders the band with both the voice and info lines', () => {
    const { container } = render(<MarqueeBeat lines={lines} skin={skin} />);
    expect(container.querySelector('.ms-mq-band')).toBeTruthy();
    expect(container.textContent).toContain('Made in the workshop');
    expect(container.textContent).toContain('Riverside Market · Sat 9am');
  });

  it('renders two rows (voice + info); the info row is the dim, reversed one', () => {
    const { container } = render(<MarqueeBeat lines={lines} skin={skin} />);
    const rows = container.querySelectorAll('.ms-mq-track');
    // Two rows, each duplicated into two runs → the tracks are the rows themselves.
    const rowEls = Array.from(rows).filter((r) => r.classList.contains('ms-mq-track'));
    expect(rowEls.length).toBe(2);
    expect(container.querySelector('.ms-mq-track.dim.rev')).toBeTruthy();
  });

  it('duplicates each row so the -50% scroll loops seamlessly, hiding the copy from a11y', () => {
    const { container } = render(<MarqueeBeat lines={lines} skin={skin} />);
    // Each of the two rows has two runs; exactly half are aria-hidden.
    const runs = container.querySelectorAll('.ms-mq-run');
    expect(runs.length).toBe(4);
    const hidden = Array.from(runs).filter((r) => r.getAttribute('aria-hidden') === 'true');
    expect(hidden.length).toBe(2);
  });

  it('renders only the line that has content', () => {
    const { container } = render(<MarqueeBeat lines={{ voice: ['Voice only'], info: [] }} skin={skin} />);
    const rows = container.querySelectorAll('.ms-mq-track');
    expect(rows.length).toBe(1);
    expect(container.querySelector('.ms-mq-track.dim')).toBeNull();
  });

  it('renders text through named type roles, using classes not inline styles', () => {
    const { container } = render(<MarqueeBeat lines={lines} skin={skin} />);
    expect(container.querySelectorAll('[data-type]').length).toBeGreaterThan(0);
    expect(container.querySelector('.ms-mq-band')?.getAttribute('style')).toBeFalsy();
  });

  it('renders nothing when both lines are empty', () => {
    const { container } = render(<MarqueeBeat lines={{ voice: [], info: [] }} skin={skin} />);
    expect(container.querySelector('.ms-mq-band')).toBeNull();
  });
});
