import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { EMPTY_PROFILE } from '@/lib/backend/profile/profile-form';
import { ShowreelLanding, ShowreelContentPage, ShowreelProduct, ShowreelShop } from './ShowreelLanding';
import type { ProductView } from '@/lib/archetypes/content';
import { TorchLanding, TorchContentPage } from './TorchLanding';
import { fill, keyWords } from '@/lib/site-words/words';
import { CARD_WORD_SPOTS, CARD_WORDS_PREFIX, type CardWords } from './words';
import type { CardData } from './data';

const K = keyWords(CARD_WORD_SPOTS, CARD_WORDS_PREFIX);
/** Test words: every spot says its own key; a spot with blanks keeps them, and the
 *  date spots read a real locale so a date can be checked. */
const S: CardWords = {
  ...K,
  dates: { ...K.dates, locale: 'en-US', day: '{weekday} {month} {day}' },
  work: { ...K.work, open: 'card.work.open {caption}', openNumbered: 'card.work.openNumbered {n}' },
  lightbox: { ...K.lightbox, count: 'card.lightbox.count {n}/{of}' },
};

const TENANT = '4b8f0f5e-8f3a-4a57-9a8e-1f2d3c4b5a69';
const photos = Array.from({ length: 10 }, (_, i) => ({ id: `m${i}`, url: `https://cdn/m${i}.webp`, caption: i === 0 ? 'The studio' : `Piece ${i}` }));

const full: CardData = {
  name: 'Paper & Patina',
  profile: {
    ...EMPTY_PROFILE,
    kicker: 'Mixed media in Warwick, RI',
    headline: 'Old furniture, reborn',
    aboutTitle: 'Nothing is too far gone',
    bio: 'I find the dressers nobody wants.\n\nNo two ever match.',
    signature: 'Dana',
    phone: '(401) 555-0100',
    facebookUrl: 'https://www.facebook.com/paperandpatina',
  },
  photos,
  dates: [{ id: 'd1', date: '2026-10-24', endDate: '', hours: '', address: '', booth: '', url: '', canceled: false, name: 'Fall Festival of Crafts', town: 'Warwick' }],
  portrait: null,
  words: S,
};
const empty: CardData = { name: 'Frank', profile: EMPTY_PROFILE, photos: [], dates: [], portrait: null, words: S };

const piece = (over: Partial<ProductView>): ProductView => ({ slug: 'x', name: 'x', price: '$1', description: '', status: 'active', media: [], variations: [], ...over });
const dresser = piece({ slug: 'peony-dresser', name: 'Peony dresser', price: '$485', description: 'Sanded back to the grain.', media: [{ kind: 'image', url: 'https://cdn/p1.webp', alt: 'The peony dresser' }, { kind: 'image', url: 'https://cdn/p2.webp', alt: '' }] });
const tray = piece({ slug: 'french-botanical-tray', name: 'French botanical tray', price: '$68', salePrice: '$54', media: [{ kind: 'image', url: 'https://cdn/t.webp', alt: '' }] });
const asking = piece({ slug: 'garden-collage', name: 'Garden collage', price: '', askForPrice: true });

afterEach(cleanup);

describe('show reel page', () => {
  it('opens on the first photo with the name slammed in, read whole by screen readers', () => {
    const { container } = render(<ShowreelLanding data={full} tenantId={TENANT} />);
    expect(container.querySelector('.sr-open .sr-main')?.getAttribute('src')).toBe('https://cdn/m0.webp');
    const h1 = screen.getByRole('heading', { level: 1, name: 'Paper & Patina' });
    expect([...h1.querySelectorAll('.sr-word')].map((w) => w.textContent)).toEqual(['Paper', '& Patina']);
    expect(container.querySelector('.sr-kick')?.textContent).toBe('Mixed media in Warwick, RI');
    expect(screen.getByRole('link', { name: S.showreel.seeWork }).getAttribute('href')).toBe('#work');
  });

  it('shows the rest of the gallery two to a row with quiet captions on Showcase, no shop link', () => {
    const { container } = render(<ShowreelLanding data={full} tenantId={TENANT} />);
    const work = container.querySelector('#work') as HTMLElement;
    const tiles = work.querySelectorAll('.sr-grid > .sr-tile');
    expect(tiles).toHaveLength(9);
    expect(tiles[0]?.querySelector('img')?.getAttribute('alt')).toBe('Piece 1');
    expect(tiles[0]?.querySelector('figcaption')?.textContent).toBe('Piece 1');
    expect(work.getAttribute('aria-label')).toBe(S.shoreline.work);
    expect(container.querySelector('a[href="/shop"]')).toBeNull();
  });

  it('puts the red about panel after the work, heading split in two', () => {
    const { container } = render(<ShowreelLanding data={full} tenantId={TENANT} />);
    const say = container.querySelector('#about');
    expect(say?.previousElementSibling?.id).toBe('work');
    expect([...(say?.querySelectorAll('h2 span') ?? [])].map((s) => s.textContent)).toEqual(['Nothing is', 'too far gone']);
    expect(say?.querySelector('.sr-sig')?.textContent).toBe('— Dana');
  });

  it('with the catalog on, shows her pieces with prices, each opening its page, and links the shop', () => {
    const { container } = render(<ShowreelLanding data={full} tenantId={TENANT} products={[dresser, tray]} />);
    const tiles = container.querySelectorAll('#work .sr-tile a');
    expect([...tiles].map((a) => a.getAttribute('href'))).toEqual(['/listings/peony-dresser', '/listings/french-botanical-tray']);
    expect(tiles[0]?.querySelector('img')?.getAttribute('alt')).toBe('The peony dresser');
    expect(tiles[0]?.querySelector('.sr-price')?.textContent).toBe('$485');
    expect(tiles[1]?.querySelector('.sr-price')?.textContent).toBe(`${S.shoreline.was} $68 $54`);
    expect(screen.getByRole('link', { name: S.shoreline.seeShop }).getAttribute('href')).toBe('/shop');
    expect(within(screen.getByRole('navigation', { name: S.shoreline.nav.label })).getByRole('link', { name: S.shoreline.nav.shop }).getAttribute('href')).toBe('/shop');
  });

  it('the shop shows every piece two to a row, or her empty-shop words', () => {
    const { container } = render(<ShowreelShop data={full} products={[dresser, tray, asking]} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(S.shoreline.work);
    expect(container.querySelectorAll('.sr-grid > .sr-tile')).toHaveLength(3);
    expect(container.querySelectorAll('.sr-tile')[2]?.querySelector('.sr-price')?.textContent).toBe(S.shoreline.askForPrice);
    expect(container.querySelector('.sr-ticker')).toBeTruthy();
    cleanup();
    render(<ShowreelShop data={full} products={[]} />);
    expect(screen.getByText(S.shoreline.emptyShop)).toBeTruthy();
  });

  it('a piece shows its photo, name, price and story, with a note already asking about it', () => {
    const { container } = render(<ShowreelProduct data={full} product={dresser} tenantId={TENANT} allPhotos={false} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Peony dresser');
    expect(container.querySelectorAll('.sr-piece-photos img')).toHaveLength(1);
    expect(container.querySelector('.sr-piece-price')?.textContent).toBe('$485');
    expect(screen.getByText('Sanded back to the grain.')).toBeTruthy();
    expect(screen.getByRole('link', { name: S.shoreline.backToShop }).getAttribute('href')).toBe('/shop');
    expect(screen.getByRole('link', { name: S.shoreline.askAbout }).getAttribute('href')).toBe('#ask');
    expect((container.querySelector('#ask textarea') as HTMLTextAreaElement).value).toBe(fill(S.shoreline.askMessage, { name: 'Peony dresser' }));
  });

  it('a piece on Full shows all its photos', () => {
    const { container } = render(<ShowreelProduct data={full} product={dresser} tenantId={TENANT} allPhotos />);
    expect(container.querySelectorAll('.sr-piece-photos img')).toHaveLength(2);
  });

  it('ends with the contact form and the ways to reach the owner, and ticks the market dates', () => {
    const { container } = render(<ShowreelLanding data={full} tenantId={TENANT} />);
    const end = container.querySelector('#touch') as HTMLElement;
    expect(within(end).getByRole('heading', { name: S.showreel.touch })).toBeTruthy();
    expect(within(end).getByRole('link', { name: '(401) 555-0100' }).getAttribute('href')).toBe('tel:+14015550100');
    expect(end.querySelector('form')).toBeTruthy();
    expect(screen.getByRole('list', { name: S.showreel.datesLabel }).textContent).toBe(['Sat Oct 24', 'Fall Festival of Crafts', 'Warwick'].join(S.dates.separator));
    expect(container.querySelector('.sr-ticker')).toBeTruthy();
  });

  it('shows only the name and footer for an owner who has filled in nothing', () => {
    const { container } = render(<ShowreelLanding data={empty} tenantId={undefined} />);
    for (const sel of ['.sr-kick', '.sr-head', '.sr-go', '#work', '#about', '.sr-ticker', 'form']) expect(container.querySelector(sel)).toBeNull();
    expect(screen.getByRole('link', { name: `${S.footer.creditPrefix} ${S.footer.creditBrand}` })).toBeTruthy();
  });

  it('never uses inline styles, and renders at rest (motion arms only in the browser)', () => {
    const { container } = render(<ShowreelLanding data={full} tenantId={TENANT} />);
    expect(container.querySelector('[style]')).toBeNull();
    expect(container.querySelector('.sr-armed')).toBeNull();
  });

  it('puts privacy and terms on the bone panel', () => {
    render(<ShowreelContentPage name="Paper & Patina" words={S} title="Privacy" body={['We keep what you send us.']} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Privacy');
    expect(screen.getByRole('link', { name: 'Paper & Patina' }).getAttribute('href')).toBe('/');
  });
});

describe('torch page', () => {
  const torch: CardData = { ...full, name: 'Ember & Pine' };

  it('burns the name in, one line per word with short words riding along', () => {
    const { container } = render(<TorchLanding data={torch} tenantId={TENANT} />);
    const h1 = screen.getByRole('heading', { level: 1, name: 'Ember & Pine' });
    expect([...h1.querySelectorAll('.tt-row .tt-ghost')].map((r) => r.textContent)).toEqual(['Ember', '& Pine']);
    expect(container.querySelector('.tt-open--2')).toBeTruthy();
    const burn = h1.querySelector('[data-burn]');
    expect(burn?.getAttribute('data-d')).toBe('1.9');
    expect(burn?.className).toContain('tt-burn--name1');
  });

  it('links to the sections that exist', () => {
    render(<TorchLanding data={torch} tenantId={TENANT} />);
    const nav = screen.getByRole('navigation', { name: S.nav.label });
    expect(within(nav).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(['#about', '#work', '#dates', '#touch']);
  });

  it('shows the about with the brand stamp, every photo as a panel, and opens one full size', () => {
    const { container } = render(<TorchLanding data={torch} tenantId={TENANT} />);
    expect(container.querySelector('.tt-initials')?.textContent).toBe('EP');
    expect(container.querySelector('#about .tt-sig')?.textContent).toBe('— Dana');
    expect(container.querySelectorAll('.tt-piece')).toHaveLength(10);
    fireEvent.click(screen.getByRole('button', { name: fill(S.work.open, { caption: 'Piece 3' }) }));
    expect(within(screen.getByRole('dialog', { name: S.lightbox.label })).getByText(`Piece 3${S.lightbox.separator}${fill(S.lightbox.count, { n: 4, of: 10 })}`)).toBeTruthy();
  });

  it('puts the market dates on planks and the form on the char card', () => {
    const { container } = render(<TorchLanding data={torch} tenantId={TENANT} />);
    const plank = container.querySelector('.tt-plank');
    expect([...(plank?.children ?? [])].map((c) => c.textContent)).toEqual(['Sat Oct 24', 'Fall Festival of Crafts', 'Warwick']);
    expect(container.querySelector('#touch .tt-form form')).toBeTruthy();
  });

  it('leaves out every section with nothing to show', () => {
    const { container } = render(<TorchLanding data={empty} tenantId={undefined} />);
    for (const sel of ['.tt-kick', '.tt-head', '.tt-btns', '#about', '#work', '#dates', '#touch', '.tt-bar nav', '.tt-stripe']) expect(container.querySelector(sel)).toBeNull();
  });

  it('never uses inline styles, and renders every word already burned in', () => {
    const { container } = render(<TorchLanding data={torch} tenantId={TENANT} />);
    expect(container.querySelector('[style]')).toBeNull();
    expect(container.querySelector('.tt-armed')).toBeNull();
  });

  it('puts privacy and terms on the pine board', () => {
    render(<TorchContentPage name="Ember & Pine" words={S} title="Terms" body={['Be kind.']} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Terms');
  });
});
