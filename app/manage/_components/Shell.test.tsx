import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const path = { current: '/manage' };
vi.mock('next/navigation', () => ({ usePathname: () => path.current }));
vi.mock('@/lib/backend/auth-actions', () => ({ signOut: vi.fn() }));

import { Shell, BARE_PATH } from './Shell';

const props = {
  siteName: 'Classic Loafs',
  siteUrl: 'https://x.example',
  email: 'm@example.com',
  nav: [{ section: 'Site', items: [{ label: 'Home', href: '/manage' }] }],
  sites: [{ tenantId: 'a', subdomain: 'alpha', businessName: 'Classic Loafs' }],
  currentTenantId: 'a',
};

describe('Shell drawer', () => {
  it('toggles aria-expanded and closes on Escape', () => {
    render(<Shell {...props}>x</Shell>);
    const btn = screen.getByRole('button', { name: 'Menu' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(btn).toHaveAttribute('aria-controls', 'bk-side');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('Shell on the market day', () => {
  it('drops the menu and top bar so the screen fills the phone', () => {
    path.current = '/manage/markets/ce9a93c8-ecf1-4522-843a-7bdddc2a803c/day';
    const { container } = render(<Shell {...props}><p>till</p></Shell>);
    expect(screen.getByText('till')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Menu' })).toBeNull();
    expect(container.querySelector('.bk-side')).toBeNull();
    path.current = '/manage';
  });

  it('is only the market day, not its setup or other market screens', () => {
    expect(BARE_PATH.test('/manage/markets/m1/day')).toBe(true);
    expect(BARE_PATH.test('/manage/markets/m1')).toBe(false);
    expect(BARE_PATH.test('/manage/markets/m1/sell')).toBe(false);
  });
});
