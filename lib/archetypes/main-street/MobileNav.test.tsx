import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MainStreetMobileNav } from './MobileNav';

const items = [
  { href: '/shop', label: 'Shop' },
  { href: '/about', label: 'About' },
  { href: '/cart', label: 'Cart' },
];

describe('MainStreetMobileNav', () => {
  it('renders a menu toggle and no overlay until opened', () => {
    render(<MainStreetMobileNav items={items} />);
    expect(screen.getByRole('button', { name: /open menu/i })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens a dialog with every link on click', () => {
    render(<MainStreetMobileNav items={items} />);
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    for (const item of items) {
      expect(screen.getByRole('link', { name: item.label })).toBeTruthy();
    }
  });

  it('closes when the close button is pressed', () => {
    render(<MainStreetMobileNav items={items} />);
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
    fireEvent.click(screen.getByRole('button', { name: /close menu/i }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes when a link is followed', () => {
    render(<MainStreetMobileNav items={items} />);
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
    fireEvent.click(screen.getByRole('link', { name: 'About' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
