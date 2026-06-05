import { describe, it, expect } from 'vitest';
import { partitionMedia } from './convert';
import type { MediaJob } from '@/lib/archetypes/builder';
import type { PortableStore } from '@/lib/archetypes/portable';

const jobs: MediaJob[] = [
  { id: 'hero', kind: 'still', prompt: 'a hero', aspect: '16:9', group: 'feature' },
  { id: 'portrait', kind: 'still', prompt: 'the maker', aspect: '1:1', group: 'feature' },
  { id: 'product:0', kind: 'still', prompt: 'p0', aspect: '1:1', group: 'product' },
  { id: 'product:1', kind: 'still', prompt: 'p1', aspect: '1:1', group: 'product' },
];

describe('partitionMedia', () => {
  it('reuses the maker photo and source product photos; generates the rest', () => {
    const portable: PortableStore = {
      shopName: 'S',
      wordmark: 'S',
      maker: { photoUrl: 'http://x/maker.jpg' },
      products: [{ name: 'A', price: '$1', photoUrl: 'http://x/0.jpg' }, { name: 'B', price: '$2' }],
    };
    const { reuse, feature, product } = partitionMedia(jobs, portable);
    expect(reuse['portrait']).toBe('http://x/maker.jpg');
    expect(reuse['product:0']).toBe('http://x/0.jpg');
    expect(feature.map((j) => j.id)).toEqual(['hero']); // portrait reused, not generated
    expect(product.map((j) => j.id)).toEqual(['product:1']); // product:0 reused
  });

  it('generates everything when the source carried no photos', () => {
    const portable: PortableStore = {
      shopName: 'S',
      wordmark: 'S',
      maker: {},
      products: [{ name: 'A', price: '$1' }, { name: 'B', price: '$2' }],
    };
    const { reuse, feature, product } = partitionMedia(jobs, portable);
    expect(Object.keys(reuse)).toHaveLength(0);
    expect(feature.map((j) => j.id)).toEqual(['hero', 'portrait']);
    expect(product.map((j) => j.id)).toEqual(['product:0', 'product:1']);
  });
});
