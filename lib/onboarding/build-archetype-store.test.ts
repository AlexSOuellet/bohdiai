import { describe, it, expect } from 'vitest';
import { recycleProductPhotos, prepareJobPrompt } from './build-archetype-store';
import type { MediaJob } from '@/lib/archetypes/builder';

describe('prepareJobPrompt', () => {
  const base: MediaJob = { id: 'x', kind: 'still', prompt: 'a wallet on stone', aspect: '1:1', group: 'product' };

  it('adds photorealism to a product image and no person phrase', () => {
    const out = prepareJobPrompt(base, 'Abigail Stone');
    expect(out.toLowerCase()).toContain('photorealistic');
    expect(out.toLowerCase()).not.toContain('a woman');
  });

  it('adds the matched person phrase to a portrait', () => {
    const portrait: MediaJob = { ...base, id: 'portrait', prompt: 'the maker at the bench', subjectIsPerson: true };
    expect(prepareJobPrompt(portrait, 'Abigail Stone').toLowerCase()).toContain('a woman');
  });
});

describe('recycleProductPhotos', () => {
  it('gives each product its own photo when there are enough', () => {
    const photos = ['a', 'b', 'c'];
    expect(recycleProductPhotos(3, photos)).toEqual(['a', 'b', 'c']);
  });

  it('recycles photos in order when products exceed the photo count', () => {
    const photos = ['a', 'b', 'c', 'd', 'e']; // the 5-image cap
    // 10 products, 5 photos → recycle
    expect(recycleProductPhotos(10, photos)).toEqual([
      'a', 'b', 'c', 'd', 'e', 'a', 'b', 'c', 'd', 'e',
    ]);
  });

  it('returns nulls when no photos generated', () => {
    expect(recycleProductPhotos(3, [])).toEqual([null, null, null]);
  });

  it('handles a single surviving photo', () => {
    expect(recycleProductPhotos(4, ['only'])).toEqual(['only', 'only', 'only', 'only']);
  });
});
