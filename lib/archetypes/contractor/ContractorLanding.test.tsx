import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CONTRACTOR_SPEC } from './builder';
import { CONTRACTOR_FIXTURE } from './fixture.test-data';
import { EstimateForm, checkEstimate } from './EstimateForm';
import { CONTRACTOR_STRINGS } from './strings';
import { PLAYBACK_RATE } from './SlowVideo';

const TENANT = '4b8f0f5e-8f3a-4a57-9a8e-1f2d3c4b5a69';

function page(brandPalette?: { base: string; accent: string }, content: unknown = CONTRACTOR_FIXTURE) {
  return render(CONTRACTOR_SPEC.render({ content, lookKey: 'contractor', products: [], tenantId: TENANT, brandPalette }));
}

const STATEMENT = {
  ...CONTRACTOR_FIXTURE,
  design: 'statement',
  hero: {
    ...CONTRACTOR_FIXTURE.hero,
    media: { kind: 'still', url: 'https://example.com/kitchen.webp', alt: 'A finished kitchen' },
    cutout: { kind: 'still', url: 'https://example.com/owner.webp', alt: 'The owner, arms crossed' },
  },
};

describe('contractor designs', () => {
  it('wears the yard design by default: the Cut-Pro page, nothing of the statement design', () => {
    const { container } = page();
    expect(container.querySelector('.cp')).not.toBeNull();
    expect(container.querySelector('.cp-hero .cp-slab')).not.toBeNull();
    expect(container.querySelector('.st')).toBeNull();
  });

  it('renders the statement design as its own page: the cover photo with the owner cut out in front', () => {
    const { container } = page(undefined, STATEMENT);
    expect(container.querySelector('.st')).not.toBeNull();
    expect(container.querySelector('.cp')).toBeNull();
    expect(container.innerHTML).not.toContain('Permanent+Marker');
    expect(container.querySelector('.st-cover__bg img')?.getAttribute('src')).toBe('https://example.com/kitchen.webp');
    expect(screen.getByRole('img', { name: 'The owner, arms crossed' })).toHaveClass('st-cover__owner');
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('st-cover__headline');
    expect(container.querySelector('.st-cover a[href="#estimate"]')).not.toBeNull();
    expect(container.querySelectorAll('a[href="tel:+14012061566"]').length).toBeGreaterThanOrEqual(4);
  });

  it('lists every service and shows every work photo, grouped room by room', () => {
    const { container } = page(undefined, STATEMENT);
    expect(container.querySelectorAll('.st-contents__item')).toHaveLength(CONTRACTOR_FIXTURE.services.items.length);
    expect(container.querySelectorAll('.st-reel__item')).toHaveLength(CONTRACTOR_FIXTURE.work.items.length);
    const tags = new Set(CONTRACTOR_FIXTURE.work.items.map((i) => i.tag).filter((t) => t !== undefined));
    expect(container.querySelectorAll('.st-reel__room')).toHaveLength(tags.size);
  });

  it('sets the first review as the pull-quote and keeps the estimate form', () => {
    const { container } = page(undefined, STATEMENT);
    expect(container.querySelector('.st-pull__quote')?.textContent).toBe(CONTRACTOR_FIXTURE.reviews?.items[0]?.quote);
    expect(container.querySelector('#estimate form')).not.toBeNull();
  });

  it('runs the statement design without a cutout too: the crew photo stands in', () => {
    const { container } = page(undefined, { ...STATEMENT, hero: { ...STATEMENT.hero, cutout: undefined } });
    expect(container.querySelector('.st-cover__owner')).toBeNull();
    expect(container.querySelector('.st-crew__figure img')?.getAttribute('src')).toBe(CONTRACTOR_FIXTURE.crew.photo.url);
  });

  it('renders the swatch design as its own page: color bands, a deck of chips, stir-stick reviews', () => {
    const items = CONTRACTOR_FIXTURE.work.items.map((item, i) => ({ ...item, swatch: { color: i === 0 ? '#b6a7d8' : '#2f4a3a', name: `Color ${String.fromCharCode(65 + i)}` } }));
    const { container } = page(undefined, { ...CONTRACTOR_FIXTURE, design: 'swatch', work: { ...CONTRACTOR_FIXTURE.work, items } });
    expect(container.querySelector('.sw')).not.toBeNull();
    expect(container.querySelector('.cp, .st')).toBeNull();
    expect(container.querySelectorAll('.sw-band:not(.sw-band--photo)')).toHaveLength(items.length);
    expect(container.querySelectorAll('.sw-chip')).toHaveLength(items.length);
    const first = container.querySelector<HTMLElement>('.sw-chip');
    expect(first?.style.getPropertyValue('--chip')).toBe('#b6a7d8');
    expect(first?.style.getPropertyValue('--chip-ink')).toBe('#1b1b1f');
    expect(container.querySelector<HTMLElement>('.sw-chip:nth-child(2)')?.style.getPropertyValue('--chip-ink')).toBe('#ffffff');
    expect(container.querySelectorAll('.sw-stick')).toHaveLength(CONTRACTOR_FIXTURE.reviews?.items.length ?? 0);
    expect(container.querySelector('#estimate form')).not.toBeNull();
    expect(container.querySelector('ol')).toBeNull();
  });

  it('rejects a swatch color that is not a hex color', () => {
    const items = CONTRACTOR_FIXTURE.work.items.map((item) => ({ ...item, swatch: { color: 'purple', name: 'Purple' } }));
    expect(() => page(undefined, { ...CONTRACTOR_FIXTURE, design: 'swatch', work: { ...CONTRACTOR_FIXTURE.work, items } })).toThrow();
  });

  it('renders the atelier design as its own page, with service cards, case studies and the comparison', () => {
    const services = { ...CONTRACTOR_FIXTURE.services, items: CONTRACTOR_FIXTURE.services.items.map((s) => ({ ...s, tags: ['One', 'Two'] })) };
    const comparison = { eyebrow: 'Why us', title: 'Why it lasts', themLabel: 'Typical', usLabel: 'Us', rows: [{ topic: 'Prep', them: 'Skipped', us: 'Done right' }] };
    const { container } = page(undefined, { ...CONTRACTOR_FIXTURE, design: 'atelier', services, comparison, banner: { label: 'Booking', text: 'Spring' } });
    expect(container.querySelector('.at')).not.toBeNull();
    expect(container.querySelector('.cp, .st, .sw')).toBeNull();
    expect(container.querySelectorAll('.at-services > li')).toHaveLength(CONTRACTOR_FIXTURE.services.items.length);
    expect(container.querySelectorAll('.at-cases > li')).toHaveLength(CONTRACTOR_FIXTURE.work.items.length);
    expect(container.querySelectorAll('.at-compare__row')).toHaveLength(1);
    expect(container.querySelector('.at-banner')).not.toBeNull();
    expect(container.querySelector('.at-est')).toBeNull();
    expect(container.querySelector('#estimate form')).not.toBeNull();
    expect(container.querySelector('ol')).toBeNull();
    expect(container.querySelector('.at-mark')?.textContent).toBe(`${CONTRACTOR_FIXTURE.business.name}${CONTRACTOR_FIXTURE.business.trade}`);
  });

  it('shows the Full pieces on the atelier page: the notice, the booked calendar and the questions', () => {
    const { container } = page(undefined, {
      ...CONTRACTOR_FIXTURE,
      design: 'atelier',
      notice: 'Now booking spring',
      calendar: { eyebrow: 'Booked', title: 'Our calendar', months: [{ year: 2026, month: 10, booked: [5] }, { year: 2026, month: 11, booked: [] }] },
      faq: { eyebrow: 'Questions', title: 'Ask us', items: [{ q: 'Do you move furniture?', a: 'Yes.' }] },
    });
    expect(container.querySelector('.at-notice')?.textContent).toContain('Now booking spring');
    expect(container.querySelectorAll('.at-cal')).toHaveLength(2);
    expect(container.querySelector('.at-faq__item summary')?.textContent).toContain('Do you move furniture?');
  });

  it('renders the harbor design: the owner over the cover, the request form first, initials on reviews, his promises', () => {
    const reviews = { ...CONTRACTOR_FIXTURE.reviews!, items: [{ quote: 'Great work.', author: 'Dr. Jeff R.' }] };
    const crew = { ...CONTRACTOR_FIXTURE.crew, promises: [{ icon: 'person', title: 'You deal with Joe', text: 'He comes out himself.' }] };
    const { container } = page(undefined, { ...STATEMENT, design: 'harbor', reviews, crew });
    expect(container.querySelector('.hb')).not.toBeNull();
    expect(container.querySelector('.cp, .st, .sw, .at')).toBeNull();
    expect(screen.getAllByRole('img', { name: 'The owner, arms crossed' })[0]).toHaveClass('hb-cover__owner');
    const sections = [...container.querySelectorAll('main > section')];
    expect(sections[1]?.id).toBe('estimate');
    expect(container.querySelector('#estimate form')).not.toBeNull();
    expect(container.querySelector('.hb-avatar')?.textContent).toBe('JR');
    expect(container.querySelector('.hb-promises')?.textContent).toContain('You deal with Joe');
    expect(container.querySelector('ol')).toBeNull();
  });

  it('renders the blueprint design as its own page, with the request form right after the cover', () => {
    const { container } = page(undefined, { ...STATEMENT, design: 'blueprint' });
    expect(container.querySelector('.bp')).not.toBeNull();
    expect(container.querySelector('.cp, .st, .sw, .at, .hb')).toBeNull();
    expect(container.querySelector('main > section:nth-of-type(2)')?.id).toBe('estimate');
    expect(container.querySelector('.bp-services__list')).not.toBeNull();
    expect(container.querySelectorAll('.bp-work__item')).toHaveLength(CONTRACTOR_FIXTURE.work.items.length);
    expect(container.querySelectorAll('.bp-quote')).toHaveLength(1);
  });

  it('rejects a design it does not know', () => {
    expect(() => page(undefined, { ...CONTRACTOR_FIXTURE, design: 'brutalist' })).toThrow();
  });
});

describe('contractor landing page', () => {
  it('paints the brand palette through CSS variables', () => {
    const { container } = page({ base: '#0b0b0b', accent: '#3dae3f' });
    expect(container.innerHTML).toContain('--cp-bg:#0b0b0b');
    expect(container.innerHTML).toContain('--cp-accent:#3dae3f');
  });

  it('falls back to its own default palette without a brand palette', () => {
    const { container } = page();
    expect(container.innerHTML).toContain('--cp-bg:#101210');
  });

  it('credits BohdiAI in the footer with the year, linking bohdiai.com', () => {
    const { container } = page();
    const credit = container.querySelector('.cp-foot a[href="https://bohdiai.com"]');
    expect(credit?.textContent).toBe(`${new Date().getFullYear()} Empowered by BohdiAI`);
  });

  it('shows shoppers no owner sign-in link (owners use /admin)', () => {
    const { container } = page();
    expect(container.querySelector('a[href*="signin"]')).toBeNull();
  });

  it('puts a dialable phone link in the header, hero, estimate block and thumb bar', () => {
    const { container } = page();
    expect(container.querySelectorAll('a[href="tel:+14012061566"]').length).toBeGreaterThanOrEqual(4);
  });

  it('autoplays only the hero video; work clips wait to be asked', () => {
    const { container } = page();
    expect(container.querySelectorAll('video').length).toBe(2);
    expect(container.querySelectorAll('video[autoplay]').length).toBe(1);
    expect(container.querySelector('.cp-slab video[autoplay]')).not.toBeNull();
    const tile = container.querySelector('.cp-vtile video') as HTMLVideoElement;
    expect(tile.autoplay).toBe(false);
    expect(tile.getAttribute('preload')).toBe('none');
  });

  it('plays every video slowed', () => {
    const { container } = page();
    for (const v of Array.from(container.querySelectorAll('video'))) {
      expect(v.playbackRate).toBe(PLAYBACK_RATE);
      expect(v.defaultPlaybackRate).toBe(PLAYBACK_RATE);
    }
  });

  it('paints the highlight word of the headline in the accent', () => {
    const { container } = page();
    expect(container.querySelector('.cp-hero__headline em')?.textContent).toBe('greener');
  });

  it('renders every section from content', () => {
    page();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('grass will always be');
    expect(screen.getByText('Real yards')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'New sod installs' })).toBeTruthy();
    expect(screen.getByText('Said 8, there at 7:45.')).toBeTruthy();
    expect(screen.getByText('We listen to our customers and SHOW UP!')).toBeTruthy();
    expect(screen.getAllByText('Connecticut').length).toBeGreaterThan(0);
    expect(screen.getByText('Tell us about your yard')).toBeTruthy();
  });

  it('offers the services and the service-area states in the estimate form', () => {
    const { container } = page();
    const chips = Array.from(container.querySelectorAll('input[name="services"]')).map((i) => (i as HTMLInputElement).value);
    expect(chips).toEqual(['Grass removal', 'New sod installs']);
    const states = Array.from(container.querySelectorAll('select[name="state"] option')).map((o) => o.textContent);
    expect(states).toContain('Massachusetts');
  });

  it('skips the reviews section when there are none', () => {
    const noReviews = { ...CONTRACTOR_FIXTURE };
    delete noReviews.reviews;
    const { container } = render(CONTRACTOR_SPEC.render({ content: noReviews, lookKey: 'contractor', products: [], tenantId: TENANT }));
    expect(container.querySelector('.cp-reviews')).toBeNull();
  });

  it('refuses to paint malformed stored content', () => {
    expect(() => CONTRACTOR_SPEC.render({ content: { business: {} }, lookKey: 'contractor', products: [] })).toThrow();
  });

  it('declares no sub-pages and stays off Bohdi’s menu', () => {
    expect(CONTRACTOR_SPEC.pages).toEqual([]);
    expect(CONTRACTOR_SPEC.handBuilt).toBe(true);
  });

  it('wraps a legal page in the same chrome', () => {
    const renderContentPage = CONTRACTOR_SPEC.renderContentPage;
    if (renderContentPage === undefined) throw new Error('no content page');
    const { container } = render(renderContentPage({ content: CONTRACTOR_FIXTURE, lookKey: 'contractor', html: '<h1>Privacy</h1>' }));
    expect(container.querySelector('.cp-prose h1')?.textContent).toBe('Privacy');
    expect(container.querySelector('.cp-head')).not.toBeNull();
  });
});

describe('checkEstimate', () => {
  const S = CONTRACTOR_STRINGS.form;
  const jpg = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
  it('asks for a name, then for a way to reach them', () => {
    expect(checkEstimate({ name: '', phone: '1', email: '' }, [])).toBe(S.errorName);
    expect(checkEstimate({ name: 'Pat', phone: '', email: '' }, [])).toBe(S.errorNeedContact);
  });
  it('checks photo count and type', () => {
    expect(checkEstimate({ name: 'Pat', phone: '1', email: '' }, Array.from({ length: 6 }, () => jpg))).toBe(S.errorTooManyPhotos);
    expect(checkEstimate({ name: 'Pat', phone: '1', email: '' }, [new File(['x'], 'a.gif', { type: 'image/gif' })])).toBe(S.errorPhotoType);
  });
  it('passes a good request', () => {
    expect(checkEstimate({ name: 'Pat', phone: '', email: 'p@x.com' }, [jpg])).toBeNull();
  });
});

describe('EstimateForm', () => {
  afterEach(() => vi.unstubAllGlobals());

  function fill() {
    render(<EstimateForm tenantId={TENANT} services={['Grading']} states={['Rhode Island']} />);
    fireEvent.change(screen.getByLabelText(CONTRACTOR_STRINGS.form.name), { target: { value: 'Pat' } });
    fireEvent.change(screen.getByLabelText(CONTRACTOR_STRINGS.form.phone), { target: { value: '401 555 0100' } });
  }

  it('shows the thank-you after a successful send', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    fill();
    fireEvent.click(screen.getByRole('button', { name: CONTRACTOR_STRINGS.form.submit }));
    await waitFor(() => expect(screen.getByText(CONTRACTOR_STRINGS.form.successTitle)).toBeTruthy());
    const body = fetchMock.mock.calls[0]?.[1]?.body as FormData;
    expect(body.get('tenantId')).toBe(TENANT);
    expect(body.get('name')).toBe('Pat');
  });

  it('shows the server’s message when the send is refused', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'Requests can’t be sent right now' }), { status: 503 })));
    fill();
    fireEvent.click(screen.getByRole('button', { name: CONTRACTOR_STRINGS.form.submit }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Requests can’t be sent right now'));
  });

  it('shows a network message when the request throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    fill();
    fireEvent.click(screen.getByRole('button', { name: CONTRACTOR_STRINGS.form.submit }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(CONTRACTOR_STRINGS.form.errorNetwork));
  });

  it('never sends without a way to reach them', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<EstimateForm tenantId={TENANT} services={[]} states={[]} />);
    fireEvent.change(screen.getByLabelText(CONTRACTOR_STRINGS.form.name), { target: { value: 'Pat' } });
    fireEvent.click(screen.getByRole('button', { name: CONTRACTOR_STRINGS.form.submit }));
    expect(screen.getByRole('alert').textContent).toBe(CONTRACTOR_STRINGS.form.errorNeedContact);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
