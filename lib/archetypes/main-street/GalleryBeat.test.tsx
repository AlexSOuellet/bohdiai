import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { GalleryBeat } from './GalleryBeat';
import { keyWords } from '@/lib/site-words/words';
import { FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX } from './words';

/** Test words: every spot says its own key, with the gallery's blanks kept. */
const W = {
  ...keyWords(FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX),
  gallery: {
    open: 'Open photo: {caption}',
    openNumbered: 'Open photo {n}',
    lightbox: { label: 'Photo viewer', close: 'Close', prev: 'Previous photo', next: 'Next photo', count: '{n} of {of}', separator: ' · ' },
  },
};
const item = (n: number, name = `Piece ${n}`) => ({ key: `k${n}`, url: `https://x/${n}.webp`, alt: name, name });

describe('GalleryBeat', () => {
  it('shows each photo with its name, no price and no link, under the site’s heading', () => {
    render(<GalleryBeat gallery={{ title: 'Recent work', label: 'Tap any piece', items: [item(1), item(2)] }} words={W} />);
    expect(screen.getByRole('heading', { name: 'Recent work' })).toBeTruthy();
    expect(screen.getByText('Piece 1')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('opens a photo large, and names a photo with no name by its place', () => {
    render(<GalleryBeat gallery={{ title: '', items: [item(1), item(2, '')] }} words={W} />);
    expect(screen.getByRole('button', { name: 'Open photo 2' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Open photo: Piece 1' }));
    expect(screen.getByRole('dialog', { name: 'Photo viewer' })).toBeTruthy();
    expect(screen.getByText(/1 of 2/)).toBeTruthy();
  });

  it('shows nothing when the gallery is empty', () => {
    const { container } = render(<GalleryBeat gallery={{ title: 'Recent work', items: [] }} words={W} />);
    expect(container.innerHTML).toBe('');
  });
});
