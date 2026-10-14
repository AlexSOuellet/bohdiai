import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MainStreetMobileNav } from './MobileNav';
import { keyWords } from '@/lib/site-words/words';
import { FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX } from './words';

/** Test words: every spot says its own key. */
const W = keyWords(FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX);

const items = [
  { href: '/shop', label: W.navShop },
  { href: '/about', label: W.navAbout },
  { href: '/cart', label: W.navCart },
];

describe('MainStreetMobileNav', () => {
  it('renders a menu toggle and no overlay until opened', () => {
    render(<MainStreetMobileNav words={W} items={items} />);
    expect(screen.getByRole('button', { name: W.ariaOpenMenu })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens a dialog with every link on click', () => {
    render(<MainStreetMobileNav words={W} items={items} />);
    fireEvent.click(screen.getByRole('button', { name: W.ariaOpenMenu }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    for (const item of items) {
      expect(screen.getByRole('link', { name: item.label })).toBeTruthy();
    }
  });

  it('closes when the close button is pressed', () => {
    render(<MainStreetMobileNav words={W} items={items} />);
    fireEvent.click(screen.getByRole('button', { name: W.ariaOpenMenu }));
    fireEvent.click(screen.getByRole('button', { name: W.ariaCloseMenu }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes when a link is followed', () => {
    render(<MainStreetMobileNav words={W} items={items} />);
    fireEvent.click(screen.getByRole('button', { name: W.ariaOpenMenu }));
    fireEvent.click(screen.getByRole('link', { name: W.navAbout }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
