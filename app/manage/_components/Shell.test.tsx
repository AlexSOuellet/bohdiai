import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('next/navigation', () => ({ usePathname: () => '/manage' }));
vi.mock('@/lib/backend/auth-actions', () => ({ signOut: vi.fn() }));

import { Shell } from './Shell';

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
    const btn = screen.getByRole('button', { name: 'Open menu' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(btn).toHaveAttribute('aria-controls', 'bk-side');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });
});
