import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { FounderPortrait } from './FounderBeats';
import { MAIN_STREET_SKINS } from './skins';
import type { MainStreetContent } from './schemas';

const skin = MAIN_STREET_SKINS['main-street-ember']!;

const longQuote =
  'Every board that leaves this shop started as a tree growing somewhere in New England. ' +
  'I want you to feel that when you pick it up — the weight of it, the grain running through your hands. ' +
  "That's what I'm after. Not a product. A thing worth keeping.";

const founder: MainStreetContent['founder'] = {
  quote: longQuote,
  attribution: 'Wally',
  treatment: 'portrait',
  photo: { prompt: 'a maker at the bench', alt: 'maker', url: 'https://example.com/portrait.jpg' },
};

afterEach(cleanup);

describe('FounderPortrait — scrim wraps the text', () => {
  it('renders a scrim element whose layout follows the text container, not a fixed bottom strip', () => {
    const { container } = render(<FounderPortrait founder={founder} skin={skin} />);
    const scrim = container.querySelector('[data-portrait-scrim]');
    expect(scrim).not.toBeNull();
    const text = container.querySelector('[data-portrait-text]');
    expect(text).not.toBeNull();
    expect(scrim?.parentElement).toBe(text?.parentElement);
  });
});
