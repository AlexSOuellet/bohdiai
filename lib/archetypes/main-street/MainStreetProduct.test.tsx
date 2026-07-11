import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MainStreetProduct } from './MainStreetProduct';
import { MAIN_STREET_SKINS } from './skins';
import type { MainStreetContent } from './schemas';
import type { ProductView } from '../content';

const skin = MAIN_STREET_SKINS['main-street-ember']!;

const content: MainStreetContent = {
  shopName: 'Tannery Row',
  identity: { wordmark: 'Tannery Row' },
  moment: {
    media: { kind: 'still', prompt: { composition: 'b', subject: 's', environment: 'e', atmosphere: 'a', camera: 'c', lighting: 'l', style: 'p' }, alt: 'x' },
    story: ['cut by hand', 'stitched to last'],
    eyebrow: 'Made in the workshop',
    brand: 'Tannery Row',
    ctaLabel: 'See the work',
  },
  goods: { title: 'The bench', label: 'The work' },
  founder: { quote: 'I make one good belt rather than ten that do not last at all here.', attribution: 'Sam', photo: { prompt: 'maker', alt: 'maker' } },
  close: { label: 'Come by', headline: 'Built to outlast us', ctaLabel: 'Order yours' },
};

afterEach(cleanup);

describe('MainStreetProduct media gallery', () => {
  it('renders multiple photos — a primary image plus the rest', () => {
    const product: ProductView = {
      slug: 'belt', name: 'The Belt', price: '$98', description: 'A belt.', status: 'active',
      media: [
        { kind: 'image', url: 'https://cdn/1.jpg', alt: 'front' },
        { kind: 'image', url: 'https://cdn/2.jpg', alt: 'side' },
        { kind: 'image', url: 'https://cdn/3.jpg', alt: 'detail' },
      ],
      variations: [],
    };
    const { container } = render(<MainStreetProduct content={content} skin={skin} product={product} />);
    expect(container.querySelectorAll('img').length).toBe(3);
  });

  it('renders a product video as a playable <video> with controls, not a static poster', () => {
    const product: ProductView = {
      slug: 'belt', name: 'The Belt', price: '$98', description: 'A belt.', status: 'active',
      media: [{ kind: 'video', url: 'https://cdn/clip.mp4', poster: 'https://cdn/poster.jpg', alt: 'demo' }],
      variations: [],
    };
    const { container } = render(<MainStreetProduct content={content} skin={skin} product={product} />);
    const video = container.querySelector('video') as HTMLVideoElement | null;
    expect(video?.getAttribute('src')).toBe('https://cdn/clip.mp4');
    expect(video?.getAttribute('poster')).toBe('https://cdn/poster.jpg');
    expect(video?.hasAttribute('controls')).toBe(true);
    expect(container.querySelector('img')).toBeNull(); // the clip is a real player, not an <img> poster
  });
});
