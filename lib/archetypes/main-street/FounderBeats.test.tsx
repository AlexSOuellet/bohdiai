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
  it('places the scrim and text in a bottom-anchored wrapper distinct from the image container, so the scrim follows the text bounding box', () => {
    const { container } = render(<FounderPortrait founder={founder} skin={skin} />);
    const scrim = container.querySelector('[data-portrait-scrim]');
    const text = container.querySelector('[data-portrait-text]');
    const anchor = container.querySelector('[data-portrait-anchor]');
    const imageContainer = container.querySelector('.ms-founder-portrait');
    expect(scrim).not.toBeNull();
    expect(text).not.toBeNull();
    expect(anchor).not.toBeNull();
    // Scrim and text are direct children of the anchor wrapper
    expect(scrim?.parentElement).toBe(anchor);
    expect(text?.parentElement).toBe(anchor);
    // The anchor is INSIDE the image container, not the image container itself —
    // this is what guarantees the scrim sizes to the text, not the image.
    expect(anchor?.parentElement).toBe(imageContainer);
  });
});
