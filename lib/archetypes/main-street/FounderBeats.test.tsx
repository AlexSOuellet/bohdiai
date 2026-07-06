import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { FounderPortrait, FounderLetter, FounderWorkbench, FounderEditorial, FounderSignature } from './FounderBeats';
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

const about = { href: '/about', label: 'Read our story' };

describe('FounderLetter — a note on paper, not a centered card', () => {
  it('lays the words on a paper slip with a clipped snapshot and a signed name', () => {
    const { container, getByText } = render(<FounderLetter founder={founder} skin={skin} about={about} />);
    // the paper slip + the clipped snapshot are what make it a letter, not a card
    expect(container.querySelector('.ms-letter-paper')).not.toBeNull();
    expect(container.querySelector('.ms-letter-clip')).not.toBeNull();
    // the name is split off the attribution and set as a signed flourish
    expect(getByText('Wally')).toBeTruthy();
    // the body carries the maker's words; the cue rides as a P.S.
    expect(container.querySelector('.ms-letter-body')?.textContent).toContain('New England');
    expect(container.querySelector('.ms-letter-ps')?.textContent).toContain('Read our story');
  });
});

describe('FounderWorkbench — the maker at work, the craft as subject', () => {
  it('shows a wide documentary shot and a caption, not a posed portrait quote', () => {
    const { container } = render(<FounderWorkbench founder={founder} skin={skin} about={about} />);
    expect(container.querySelector('.ms-wb-photo')).not.toBeNull();
    expect(container.querySelector('.ms-wb-name')?.textContent).toContain('Wally');
    expect(container.querySelector('.ms-wb-intro')?.textContent).toContain('New England');
  });
});

const aboutPage = {
  heading: 'The hands behind every board',
  story: ['Wally started in a borrowed garage.', 'Ten years on he still planes every edge by hand.'],
};

describe('FounderEditorial — a magazine feature off the About story', () => {
  it('lays the About story in columns with a headline and a distinct pull-quote', () => {
    const { container, getByText } = render(
      <FounderEditorial founder={founder} skin={skin} about={about} aboutPage={aboutPage} />,
    );
    expect(getByText('The hands behind every board')).toBeTruthy();
    const cols = container.querySelector('.ms-ed-cols');
    expect(cols?.textContent).toContain('borrowed garage');
    expect(cols?.textContent).toContain('planes every edge');
    // the quote becomes the pull-quote, distinct from the story body
    expect(container.querySelector('.ms-ed-pull')?.textContent).toContain('New England');
  });

  it('falls back to the quote and drops the pull-quote when there is no About story', () => {
    const { container } = render(<FounderEditorial founder={founder} skin={skin} about={about} />);
    expect(container.querySelector('.ms-ed-cols')?.textContent).toContain('New England');
    expect(container.querySelector('.ms-ed-pull')).toBeNull();
  });
});

describe('FounderSignature — a type-led manifesto, no photo', () => {
  it('sets the promise as a large statement signed by name, carrying no portrait', () => {
    const { container, getByText } = render(<FounderSignature founder={founder} skin={skin} about={about} />);
    expect(container.querySelector('.ms-sig-statement')?.textContent).toContain('New England');
    expect(getByText('Wally')).toBeTruthy();
    // the manifesto carries no image — type carries it
    expect(container.querySelector('.archetype-photo')).toBeNull();
  });
});
