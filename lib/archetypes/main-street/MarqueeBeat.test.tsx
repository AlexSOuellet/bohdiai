import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MarqueeBeat } from './MarqueeBeat';
import { MAIN_STREET_SKINS } from './skins';

const skin = MAIN_STREET_SKINS['main-street-ember']!;
const phrases = ['Small batch', 'Made by hand', 'New this week'];

afterEach(cleanup);

describe('MarqueeBeat', () => {
  it('renders the band with each phrase', () => {
    const { container } = render(<MarqueeBeat items={phrases} skin={skin} />);
    expect(container.querySelector('.ms-mq-band')).toBeTruthy();
    phrases.forEach((p) => expect(container.textContent).toContain(p));
  });

  it('duplicates the run so the -50% scroll loops seamlessly, hiding the second copy from a11y', () => {
    const { container } = render(<MarqueeBeat items={phrases} skin={skin} />);
    const runs = container.querySelectorAll('.ms-mq-run');
    expect(runs.length).toBe(2);
    // One run is visible to assistive tech, the duplicate is aria-hidden.
    const hidden = Array.from(runs).filter((r) => r.getAttribute('aria-hidden') === 'true');
    expect(hidden.length).toBe(1);
  });

  it('renders text through named type roles', () => {
    const { container } = render(<MarqueeBeat items={phrases} skin={skin} />);
    expect(container.querySelectorAll('[data-type]').length).toBeGreaterThan(0);
  });

  it('uses classes, not inline style objects', () => {
    const { container } = render(<MarqueeBeat items={phrases} skin={skin} />);
    expect(container.querySelector('.ms-mq-band')?.getAttribute('style')).toBeFalsy();
    expect(container.querySelector('.ms-mq-track')?.getAttribute('style')).toBeFalsy();
  });

  it('renders nothing when there are no phrases', () => {
    const { container } = render(<MarqueeBeat items={[]} skin={skin} />);
    expect(container.querySelector('.ms-mq-band')).toBeNull();
  });
});
