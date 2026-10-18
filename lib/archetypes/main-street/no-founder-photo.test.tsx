import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { FounderCard, FounderLetter, FounderPortrait, FounderQuote, FounderWorkbench, hasFounderPhoto } from './FounderBeats';
import { FounderCabinet } from './VintagePieces';
import { longestWord } from './PlaybillHero';
import { BILL_LONGEST_WORD, VINTAGE_CSS } from './vintage-styles';
import { MAIN_STREET_SKINS } from './skins';
import type { MainStreetView } from './schemas';
import { keyWords } from '@/lib/site-words/words';
import { FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX } from './words';

/** A maker who sent no photo of themselves must never get an empty frame (Session 108). */
const W = keyWords(FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX);
const skin = MAIN_STREET_SKINS['main-street-ember']!;
const noPhoto: MainStreetView['founder'] = { quote: 'Every candle is a small fire.', attribution: 'June, maker', photo: { alt: '' } };
const withPhoto: MainStreetView['founder'] = { ...noPhoto, photo: { alt: 'June', url: 'https://cdn/june.webp' } };

afterEach(cleanup);

describe('about designs with no photo of the maker', () => {
  it('knows a photo only by its address', () => {
    expect(hasFounderPhoto(noPhoto)).toBe(false);
    expect(hasFounderPhoto({ photo: { alt: '', url: '' } })).toBe(false);
    expect(hasFounderPhoto(withPhoto)).toBe(true);
  });

  it('quote: the words stand alone in one column, no photo frame', () => {
    const { container } = render(<FounderQuote founder={noPhoto} skin={skin} />);
    expect(container.querySelector('.ms-founder-quote-photo')).toBeNull();
    expect(container.querySelector('.ms-founder-quote--words')).not.toBeNull();
    expect(container.textContent).toContain('Every candle is a small fire.');
  });

  it('portrait: with nothing to frame, it shows the words as the quote design does', () => {
    const { container } = render(<FounderPortrait founder={noPhoto} skin={skin} />);
    expect(container.querySelector('.ms-founder-portrait-frame')).toBeNull();
    expect(container.querySelector('.ms-founder-quote--words')).not.toBeNull();
  });

  it('letter, card and workbench leave their photo out', () => {
    expect(render(<FounderLetter founder={noPhoto} skin={skin} words={W} />).container.querySelector('.ms-letter-clip')).toBeNull();
    cleanup();
    expect(render(<FounderCard founder={noPhoto} skin={skin} />).container.querySelector('.ms-founder-card-avatar')).toBeNull();
    cleanup();
    expect(render(<FounderWorkbench founder={noPhoto} skin={skin} />).container.querySelector('.ms-wb-photo')).toBeNull();
  });

  it('Vintage’s cabinet card drops the card and keeps the words', () => {
    const { container } = render(<FounderCabinet founder={noPhoto} skin={skin} />);
    expect(container.querySelector('.ms-cab-card')).toBeNull();
    expect(container.querySelector('.ms-cab-grid--words')).not.toBeNull();
    expect(container.textContent).toContain('Every candle is a small fire.');
  });

  it('with a photo, every design still shows it', () => {
    expect(render(<FounderQuote founder={withPhoto} skin={skin} />).container.querySelector('.ms-founder-quote-photo')).not.toBeNull();
    cleanup();
    expect(render(<FounderCabinet founder={withPhoto} skin={skin} />).container.querySelector('.ms-cab-card')).not.toBeNull();
  });
});

describe('the Vintage opening sizes a long name to fit', () => {
  it('measures the longest word, capped at what the styles size for', () => {
    expect(longestWord('Saltmarsh & Lace')).toBe(9);
    expect(longestWord('Bloom')).toBe(5);
    expect(longestWord('x'.repeat(40))).toBe(BILL_LONGEST_WORD);
  });

  it('has a fitting rule for every long word, on phones and wide screens', () => {
    for (let n = 7; n <= BILL_LONGEST_WORD; n++) {
      expect(VINTAGE_CSS.split(`.ms-bill-brand[data-word="${n}"]`).length - 1).toBe(2);
    }
  });
});
