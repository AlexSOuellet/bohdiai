import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { FindUsBeat } from './FindUsBeat';
import { MAIN_STREET_SKINS } from './skins';

const skin = MAIN_STREET_SKINS['main-street-ember']!;

const findUs = {
  label: 'Find us this month',
  eventsLabel: 'See all our markets',
  rows: [
    { day: 'Sat 6/7', where: 'Hope St Farmers Market', time: '9-11am' },
    { day: 'Sat 6/14', where: 'Armory Pop-Up', time: '10-1pm' },
  ],
};

afterEach(cleanup);

describe('FindUsBeat', () => {
  it('renders the dates as its own section with an events cue', () => {
    const { getByText, container } = render(<FindUsBeat findUs={findUs} skin={skin} eventsHref="/events" />);
    expect(getByText('Hope St Farmers Market')).toBeTruthy();
    expect(container.querySelectorAll('[data-type="day"]').length).toBe(2);
    const cue = container.querySelector('.ms-eventscue') as HTMLAnchorElement;
    expect(cue.getAttribute('href')).toBe('/events');
    expect(cue.textContent).toContain('See all our markets');
  });

  it('renders on the base surface (not the contrast band)', () => {
    const { container } = render(<FindUsBeat findUs={findUs} skin={skin} />);
    const section = container.querySelector('[data-ms-findus]') as HTMLElement;
    expect(section.style.background).toContain('--ms-bg');
  });
});
