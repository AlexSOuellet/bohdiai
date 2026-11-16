import { describe, it, expect } from 'vitest';
import { textBlocks, textLines } from './plain-text';

describe('textBlocks', () => {
  it('splits headings and paragraphs, joining a paragraph’s lines', () => {
    expect(textBlocks('## Yours\nYour work\nis yours.\n\n## Leaving\r\nCancel any time.')).toEqual([
      { kind: 'heading', text: 'Yours' },
      { kind: 'paragraph', text: 'Your work is yours.' },
      { kind: 'heading', text: 'Leaving' },
      { kind: 'paragraph', text: 'Cancel any time.' },
    ]);
  });
  it('gives nothing for blank words', () => {
    expect(textBlocks('  \n\n ')).toEqual([]);
  });
});

describe('textLines', () => {
  it('one thing per line, blanks dropped', () => {
    expect(textLines('Weapons\n\n  Drugs \r\nLive animals')).toEqual([
      'Weapons',
      'Drugs',
      'Live animals',
    ]);
  });
});
