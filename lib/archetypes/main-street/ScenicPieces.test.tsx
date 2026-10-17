import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { keyWords } from '@/lib/site-words/words';
import { FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX } from './words';
import { MAIN_STREET_SKINS } from './skins';
import { CollectionsFrames, FindUsTide, FounderPane, GoodsPrints, HorizonHero, ReviewsNotes } from './ScenicPieces';
import { FAMILIES } from './families';
import { SCENES, DEFAULT_SCENE } from './scenes';
import { MainStreetRoot } from './chrome';
import type { ProductView } from '../content';
import type { MainStreetView } from './schemas';

const W = { ...keyWords(FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX), itemsOne: '{n} piece', items: '{n} pieces' };
const skin = MAIN_STREET_SKINS['main-street-saltmarsh']!;
const identity: MainStreetView['identity'] = { wordmark: 'Saltmarsh & Lace' };
const moment = {
  media: { kind: 'still', url: 'https://cdn/open.webp', alt: 'A bottle' },
  story: [],
  eyebrow: 'Decoupage from Bristol',
  brand: 'Saltmarsh & Lace',
  sub: 'Old prints, given a second life.',
  ctaLabel: 'See the pieces',
  ctaTarget: 'shop',
  secondaryCtaLabel: 'Read the story',
  secondaryCtaTarget: 'about',
} as unknown as MainStreetView['moment'];

const piece = (n: number): ProductView => ({ slug: `p${n}`, name: `Piece ${n}`, price: `$${n}0`, description: '', status: 'active', media: [{ kind: 'image', url: `https://cdn/${n}.webp`, alt: `Piece ${n}` }], variations: [] });
const founder = {
  quote: 'Every bottle starts as something someone threw away.',
  attribution: 'Lena',
  eyebrow: 'The maker',
  heading: 'From the paint counter',
  photo: { url: 'https://cdn/lena.webp', alt: 'Lena' },
} as unknown as MainStreetView['founder'];

afterEach(cleanup);

describe('the Scenic family', () => {
  it('wears its own pieces by default, the about right after the work', () => {
    expect(FAMILIES.scenic.sectionDefaults).toMatchObject({ hero: 'horizon', goods: 'prints', founder: 'pane', collections: 'frames', findUs: 'tide', reviews: 'notes' });
    expect(FAMILIES.scenic.sectionStack.find((e) => e.lead)?.section).toBe('goods');
  });
  it('paints the default scene behind the page at full strength, where its focus sits', () => {
    expect(FAMILIES.scenic.wallpaperUrl).toBe(SCENES[DEFAULT_SCENE].url);
    expect(FAMILIES.scenic.textureOpacity).toBe(1);
    expect(FAMILIES.scenic.textureFocus).toBe(SCENES[DEFAULT_SCENE].focus);
    expect(FAMILIES.scenic.defaultSkin).toBe('main-street-saltmarsh');
  });
  it('the page root carries the scene photo and its focus as variables', () => {
    const { container } = render(
      <MainStreetRoot skin={skin} family={{ ...FAMILIES.scenic, wallpaperUrl: 'https://cdn/own.webp', textureFocus: 'center 30%' }}>
        <p>x</p>
      </MainStreetRoot>,
    );
    const css = [...container.querySelectorAll('style')].map((s) => s.innerHTML).join('');
    expect(css).toContain('--ms-texture-url:url("https://cdn/own.webp")');
    expect(css).toContain('--ms-texture-focus:center 30%');
    expect(container.querySelector('[data-ms-family="scenic"] .ms-family-texture')).not.toBeNull();
  });
});

describe('a clip behind the page', () => {
  it('loops muted over its still, marked dark so the lettering turns light', () => {
    const { container } = render(
      <MainStreetRoot skin={skin} family={{ ...FAMILIES.scenic, wallpaperUrl: 'https://cdn/still.webp', textureTone: 'dark', textureVideo: 'https://cdn/clip.mp4' }}>
        <p>x</p>
      </MainStreetRoot>,
    );
    const root = container.querySelector('.arch-main-street');
    expect(root?.getAttribute('data-ms-texture-tone')).toBe('dark');
    const video = container.querySelector('video.ms-family-video') as HTMLVideoElement | null;
    expect(video?.getAttribute('src')).toBe('https://cdn/clip.mp4');
    expect(video?.getAttribute('poster')).toBe('https://cdn/still.webp');
    expect(video?.muted).toBe(true);
    expect(video?.loop).toBe(true);
    expect(video?.getAttribute('aria-hidden')).toBe('true');
  });
  it('with no clip, there is no video and no tone mark', () => {
    const { container } = render(<MainStreetRoot skin={skin} family={FAMILIES.scenic}><p>x</p></MainStreetRoot>);
    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('.arch-main-street')?.hasAttribute('data-ms-texture-tone')).toBe(false);
  });
});

describe('HorizonHero', () => {
  it('sets the name on the sky with the moment’s lines and buttons, and nothing else', () => {
    const { container } = render(<HorizonHero identity={identity} moment={moment} words={W} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Saltmarsh & Lace');
    expect(container.querySelector('.ms-sc-line')?.textContent).toBe('Decoupage from Bristol');
    expect(container.querySelector('.ms-sc-sub')?.textContent).toBe('Old prints, given a second life.');
    expect(screen.getByRole('link', { name: 'See the pieces' }).getAttribute('href')).toBe('/shop');
    expect(screen.getByRole('link', { name: 'Read the story' }).getAttribute('href')).toBe('/about');
    // The scene is the photo: the opening shows no photo of its own.
    expect(container.querySelector('[data-ms-hero="horizon"] .archetype-photo')).toBeNull();
    expect(container.querySelector('[style]')).toBeNull();
  });
  it('leaves out the lines and second button it wasn’t given', () => {
    const bare = { ...moment, sub: undefined, eyebrow: '', secondaryCtaLabel: undefined } as unknown as MainStreetView['moment'];
    const { container } = render(<HorizonHero identity={identity} moment={bare} words={W} />);
    expect(container.querySelector('.ms-sc-line')).toBeNull();
    expect(container.querySelector('.ms-sc-sub')).toBeNull();
    expect(container.querySelector('.ms-sc-cta2')).toBeNull();
  });
});

describe('GoodsPrints', () => {
  it('hangs each piece as a matted print with its name and price on a label, opening its page', () => {
    const goods = { title: 'On the shelf', label: 'This month' };
    const { container } = render(<GoodsPrints goods={goods} products={[piece(1), piece(2)]} skin={skin} words={W} viewAll={{ href: '/shop', label: 'See everything' }} />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('On the shelf');
    expect(container.querySelectorAll('.ms-sc-print')).toHaveLength(2);
    expect(container.querySelector('.ms-sc-print')?.getAttribute('href')).toBe('/listings/p1');
    expect(container.querySelector('.ms-sc-label-name')?.textContent).toBe('Piece 1');
    expect(container.querySelector('.ms-sc-mat img')?.getAttribute('alt')).toBe('Piece 1');
    expect(container.querySelector('[style]')).toBeNull();
  });
});

describe('FounderPane', () => {
  it('holds the heading, the portrait, the quote and the signature, with the way to the full story', () => {
    const { container } = render(<FounderPane founder={founder} skin={skin} about={{ href: '/about', label: 'Read my story' }} />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('From the paint counter');
    expect(container.querySelector('.ms-sc-eyebrow')?.textContent).toBe('The maker');
    expect(container.querySelector('.ms-sc-pane-photo img')?.getAttribute('src')).toBe('https://cdn/lena.webp');
    expect(container.querySelector('.ms-sc-pane-quote')?.textContent).toBe(founder.quote);
    expect(container.querySelector('.ms-sc-pane-sig')?.textContent).toBe('Lena');
    expect(screen.getByRole('link', { name: 'Read my story' }).getAttribute('href')).toBe('/about');
  });
  it('with no portrait, the pane is words only (no empty frame)', () => {
    const { container } = render(<FounderPane founder={{ ...founder, photo: { alt: '' } }} skin={skin} />);
    expect(container.querySelector('.ms-sc-pane-photo')).toBeNull();
    expect(container.querySelector('.ms-sc-pane--words')).not.toBeNull();
    expect(container.querySelector('.ms-sc-cue')).toBeNull();
  });
});

describe('CollectionsFrames', () => {
  it('frames each collection with its name and how many pieces', () => {
    const items = [{ slug: 'bottles', name: 'Bottles', count: 4, cover: { kind: 'image' as const, url: 'https://cdn/b.webp', alt: 'Bottles' } }];
    const { container } = render(<CollectionsFrames section={{ title: 'By kind', label: 'Browse' }} items={items} skin={skin} words={W} viewAll={{ href: '/collections', label: 'All of them' }} />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('By kind');
    expect(container.querySelector('.ms-sc-frame')?.getAttribute('href')).toBe('/collections/bottles');
    expect(container.querySelector('.ms-sc-frame .ms-sc-label-price')?.textContent).toBe('4 pieces');
    expect(screen.getByRole('link', { name: 'All of them' }).getAttribute('href')).toBe('/collections');
  });
});

describe('FindUsTide', () => {
  it('lists the day, where and the hours in quiet rows', () => {
    const events = [{ day: 'Sat Oct 18', where: 'Wickford Art Festival, Wickford', time: '9–3' }, { day: 'Sun Oct 19', where: 'Bristol Common', time: '' }];
    const { container } = render(<FindUsTide section={{ label: 'Find me', rows: events }} events={events} skin={skin} words={W} viewAll={{ href: '/events', label: 'Every date' }} />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Find me');
    expect(container.querySelectorAll('.ms-sc-tide-row')).toHaveLength(2);
    expect(container.querySelectorAll('.ms-sc-tide-time')).toHaveLength(1);
    expect(container.querySelector('[data-ms-fu-viewall]')?.getAttribute('href')).toBe('/events');
  });
});

describe('ReviewsNotes', () => {
  it('pins each review as a signed note', () => {
    const items = [{ quote: 'Beautiful work.', author: 'Ann', location: 'Newport' }, { quote: 'Lovely.', author: 'Bo' }];
    const { container } = render(<ReviewsNotes section={{ title: 'Kind words', items }} items={items} skin={skin} words={W} />);
    expect(container.querySelectorAll('.ms-sc-note')).toHaveLength(2);
    expect(container.querySelector('.ms-sc-note-who')?.textContent).toBe('Ann');
    expect(container.querySelectorAll('.ms-sc-note-from')).toHaveLength(1);
  });
});
