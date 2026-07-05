import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { FounderBeat } from './FounderBeat';
import { selectFounderTreatment } from './founder';
import { MAIN_STREET_SKINS } from './skins';
import type { MainStreetContent } from './schemas';

const skin = MAIN_STREET_SKINS['main-street-ember']!;

const baseFounder: MainStreetContent['founder'] = {
  quote: 'I started with one cast-iron oven and a starter named Frank',
  attribution: 'June Carter, founder and baker',
  photo: { prompt: 'baker in a kitchen', alt: 'June' },
};

const cardFounder: MainStreetContent['founder'] = {
  ...baseFounder,
  eyebrow: 'Since 2019',
  heading: 'Meet June',
};

afterEach(cleanup);

describe('selectFounderTreatment', () => {
  it('honors an explicit Bohdi pick', () => {
    expect(selectFounderTreatment('portrait')).toBe('portrait');
  });
  it('falls back to the quote when nothing was picked — never keyed off mood', () => {
    expect(selectFounderTreatment()).toBe('quote');
    expect(selectFounderTreatment(undefined)).toBe('quote');
  });
  it('returns only real About treatments', () => {
    const all = ['quote', 'portrait', 'letter', 'card', 'workbench', 'editorial', 'signature'] as const;
    for (const pick of [...all, undefined]) {
      expect(all).toContain(selectFounderTreatment(pick));
    }
  });
});

describe('FounderBeat — maker-only treatments on the contrast band', () => {
  for (const treatment of ['quote', 'portrait', 'letter', 'card', 'workbench', 'editorial', 'signature'] as const) {
    it(`${treatment} renders the maker quote on the contrast surface and no calendar`, () => {
      const { getByText, container } = render(<FounderBeat founder={cardFounder} skin={skin} treatment={treatment} />);
      expect(getByText(/cast-iron oven/)).toBeTruthy();
      const band = container.querySelector('[data-ms-founder]') as HTMLElement;
      // Class-only: the contrast surface comes from the .ms-founder-band class in
      // skinVarsCss, never inline. Assert the class hook, not a style property.
      expect(band.className).toContain('ms-founder-band');
      expect(band.getAttribute('style')).toBeNull();
      // The calendar is its own beat now — never inside the founder band.
      expect(container.querySelector('[data-type="day"]')).toBeNull();
      expect(container.querySelector('.ms-eventscue')).toBeNull();
    });
  }

  it('the card treatment shows the eyebrow and heading', () => {
    const { getByText } = render(<FounderBeat founder={cardFounder} skin={skin} treatment="card" />);
    expect(getByText('Meet June')).toBeTruthy();
    expect(getByText('Since 2019')).toBeTruthy();
  });
});

describe('FounderBeat — the about teaser cue', () => {
  it('renders the about cue pointing at the bio page', () => {
    const { container } = render(<FounderBeat founder={baseFounder} skin={skin} treatment="quote" aboutHref="/about" />);
    const cue = container.querySelector('.ms-aboutcue') as HTMLAnchorElement;
    expect(cue.getAttribute('href')).toBe('/about');
    expect(cue.textContent).toContain('Read the full story');
  });
  it('uses the maker-authored about label when present', () => {
    const f = { ...baseFounder, aboutLabel: 'Meet the baker' };
    const { container } = render(<FounderBeat founder={f} skin={skin} treatment="quote" />);
    expect((container.querySelector('.ms-aboutcue') as HTMLElement).textContent).toContain('Meet the baker');
  });
  it('honors a Bohdi-authored treatment on the founder content', () => {
    const { getByText } = render(<FounderBeat founder={{ ...cardFounder, treatment: 'card' }} skin={skin} />);
    expect(getByText('Meet June')).toBeTruthy();
  });
});
