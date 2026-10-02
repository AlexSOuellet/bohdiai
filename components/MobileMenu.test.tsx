import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileMenu } from './MobileMenu';
import { NAV_LINKS } from './Header';

describe('MobileMenu', () => {
  it('opens to every link, Pricing and FAQ first', async () => {
    render(<MobileMenu links={NAV_LINKS} />);
    expect(screen.queryByRole('navigation', { name: 'Menu' })).toBeNull();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getAllByRole('link').map((a) => a.textContent)).toEqual(['Pricing', 'FAQ', 'Work', 'About', 'Contact']);
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes on a link tap and on Escape', async () => {
    const u = userEvent.setup();
    render(<MobileMenu links={NAV_LINKS} />);
    await u.click(screen.getByRole('button', { name: 'Open menu' }));
    await u.click(screen.getByRole('link', { name: 'FAQ' }));
    expect(screen.queryByRole('navigation', { name: 'Menu' })).toBeNull();
    await u.click(screen.getByRole('button', { name: 'Open menu' }));
    await u.keyboard('{Escape}');
    expect(screen.queryByRole('navigation', { name: 'Menu' })).toBeNull();
  });
});
