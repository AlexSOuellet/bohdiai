import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CONTRACTOR_SPEC } from './builder';
import { CONTRACTOR_FIXTURE } from './fixture.test-data';
import { EstimateForm, checkEstimate } from './EstimateForm';
import { CONTRACTOR_STRINGS } from './strings';
import { PLAYBACK_RATE } from './SlowVideo';

const TENANT = '4b8f0f5e-8f3a-4a57-9a8e-1f2d3c4b5a69';

function page(brandPalette?: { base: string; accent: string }) {
  return render(CONTRACTOR_SPEC.render({ content: CONTRACTOR_FIXTURE, lookKey: 'contractor', products: [], tenantId: TENANT, brandPalette }));
}

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
