import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { FindUsBeat } from './FindUsBeat';
import { MAIN_STREET_SKINS } from './skins';
import type { FindUsSection } from './findus';

const skin = MAIN_STREET_SKINS['main-street-ember']!;

const findUs: FindUsSection = {
  label: 'Find us in person',
  eventsLabel: 'See all our markets',
  rows: [
    { date: '2025-07-12', day: 'Sat, Jul 12', where: 'Hope St Farmers Market', time: '9–11am', kind: 'market' },
    { date: '2025-07-24', day: 'Thu, Jul 24', where: 'Pouring Workshop', time: '6–8pm', kind: 'workshop' },
  ],
};

afterEach(cleanup);

describe('FindUsBeat — the dispatcher', () => {
  it('renders the board by default (no authored or forced treatment)', () => {
    const { container, getByText } = render(<FindUsBeat findUs={findUs} skin={skin} eventsHref="/events" />);
    expect(container.querySelector('.ms-fu-board')).toBeTruthy();
    expect(getByText('Hope St Farmers Market')).toBeTruthy();
  });

  it.each([
    ['calendar', '.ms-fu-cal'],
    ['passes', '.ms-fu-passes'],
    ['next-stop', '.ms-fu-next'],
    ['itinerary', '.ms-fu-itin'],
    ['poster', '.ms-fu-poster'],
    ['board', '.ms-fu-board'],
  ] as const)('renders the %s treatment when forced', (treatment, selector) => {
    const { container } = render(<FindUsBeat findUs={findUs} skin={skin} treatment={treatment} />);
    expect(container.querySelector(selector)).toBeTruthy();
    expect(container.querySelector('#find-us')).toBeTruthy();
  });

  it('renders the treatment the caller passes (the family picks it)', () => {
    const { container } = render(<FindUsBeat findUs={findUs} skin={skin} treatment="poster" />);
    expect(container.querySelector('.ms-fu-poster')).toBeTruthy();
  });

  it('renders whichever treatment the caller changes to (previews / editor)', () => {
    const { container } = render(<FindUsBeat findUs={findUs} skin={skin} treatment="itinerary" />);
    expect(container.querySelector('.ms-fu-itin')).toBeTruthy();
    expect(container.querySelector('.ms-fu-poster')).toBeNull();
  });

  it('renders the events cue with the authored label and href', () => {
    const { container } = render(<FindUsBeat findUs={findUs} skin={skin} eventsHref="/events" />);
    const cue = container.querySelector('[data-ms-fu-viewall]') as HTMLAnchorElement;
    expect(cue.getAttribute('href')).toBe('/events');
    expect(cue.textContent).toContain('See all our markets');
  });

  it('renders nothing when there are no dates', () => {
    const { container } = render(<FindUsBeat findUs={{ ...findUs, rows: [] }} skin={skin} />);
    expect(container.querySelector('#find-us')).toBeNull();
  });
});
