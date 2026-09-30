import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const path = vi.hoisted(() => ({ current: '/manage' }));
vi.mock('next/navigation', () => ({ usePathname: () => path.current }));
vi.mock('@/lib/backend/auth-actions', () => ({ signOut: vi.fn() }));

import { Sidebar } from './Sidebar';

const base = {
  siteName: 'Classic Loafs',
  email: 'maker@example.com',
  nav: [{ section: 'Site', items: [{ label: 'Home', href: '/manage' }] }],
  sites: [{ tenantId: 'a', subdomain: 'alpha', businessName: 'Classic Loafs' }],
  currentTenantId: 'a',
  onNavigate: () => {},
};

describe('Sidebar', () => {
  it('matches nested pages but keeps Home exact', () => {
    const nav = [{ section: 'Site', items: [{ label: 'Home', href: '/manage' }, { label: 'Products', href: '/manage/products' }] }];
    path.current = '/manage/products/123';
    const { unmount } = render(<Sidebar {...base} nav={nav} />);
    expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
    unmount();
    path.current = '/manage';
  });
  it('shows the client’s own site name, not Penny’s', () => {
    render(<Sidebar {...base} />);
    expect(screen.getByText('Classic Loafs')).toBeInTheDocument();
    expect(screen.queryByText(/Decoupage/)).toBeNull();
  });
  it('marks the current page', () => {
    render(<Sidebar {...base} />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
  });
  it('shows a site picker only for people with more than one site', () => {
    const { rerender } = render(<Sidebar {...base} />);
    expect(screen.queryByLabelText('Switch site')).toBeNull();
    rerender(<Sidebar {...base} sites={[...base.sites, { tenantId: 'b', subdomain: 'beta', businessName: 'Beta' }]} />);
    expect(screen.getByLabelText('Switch site')).toBeInTheDocument();
  });
  it('has a sign-out button', () => {
    render(<Sidebar {...base} />);
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });
});
