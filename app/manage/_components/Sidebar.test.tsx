import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const path = vi.hoisted(() => ({ current: '/manage' }));
vi.mock('next/navigation', () => ({ usePathname: () => path.current }));
vi.mock('@/lib/backend/auth-actions', () => ({ signOut: vi.fn() }));

import { Sidebar } from './Sidebar';
import { ScreenTabs } from './ScreenTabs';
import { BottomBar } from './BottomBar';

const nav = [
  { section: '', items: [{ label: 'Home', href: '/manage' }] },
  { section: 'Products', items: [{ label: 'Products', href: '/manage/products' }, { label: 'Collections', href: '/manage/collections' }] },
  { section: 'Events', items: [{ label: 'Schedule', href: '/manage/markets' }, { label: 'Results', href: '/manage/markets/results' }] },
  { section: 'My site', items: [{ label: 'Headline', href: '/manage/headline' }, { label: 'About you', href: '/manage/profile' }] },
  { section: 'Account', items: [{ label: 'Your plan', href: '/manage/plan' }] },
  { section: 'Help', items: [{ label: 'Contact support', href: '/manage/support' }] },
];

const base = {
  siteName: 'Classic Loafs',
  siteUrl: 'https://classic-loafs.bohdiai.com',
  email: 'maker@example.com',
  nav,
  sites: [{ tenantId: 'a', subdomain: 'alpha', businessName: 'Classic Loafs' }],
  currentTenantId: 'a',
  onNavigate: () => {},
};

describe('Sidebar', () => {
  it('shows one entry per group, in her words, never folded', () => {
    path.current = '/manage';
    render(<Sidebar {...base} />);
    const links = screen.getAllByRole('link').map((a) => a.textContent);
    expect(links).toEqual(['Classic Loafs', 'Open my site', 'Home', 'Products', 'Events', 'My site', 'Account', 'Help']);
    expect(screen.queryByRole('button', { name: 'Products' })).toBeNull();
  });
  it('opens My site on its own page and Help on Contact support', () => {
    render(<Sidebar {...base} />);
    expect(screen.getByRole('link', { name: 'My site' })).toHaveAttribute('href', '/manage/site');
    expect(screen.getByRole('link', { name: 'Help' })).toHaveAttribute('href', '/manage/support');
  });
  it('marks the group of the screen you are on, and keeps Home exact', () => {
    path.current = '/manage/profile';
    render(<Sidebar {...base} />);
    expect(screen.getByRole('link', { name: 'My site' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
    path.current = '/manage';
  });
  it('shows the client’s own site name, not Penny’s', () => {
    render(<Sidebar {...base} />);
    expect(screen.getByText('Classic Loafs')).toBeInTheDocument();
    expect(screen.queryByText(/Decoupage/)).toBeNull();
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

describe('ScreenTabs', () => {
  it('shows a group’s screens as tabs and marks the one you are on', () => {
    path.current = '/manage/markets/results';
    render(<ScreenTabs nav={nav} />);
    expect(screen.getByRole('link', { name: 'Results' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Schedule' })).not.toHaveAttribute('aria-current');
  });
  it('shows nothing for a group of one', () => {
    path.current = '/manage/plan';
    const { container } = render(<ScreenTabs nav={nav} />);
    expect(container).toBeEmptyDOMElement();
  });
  it('inside My site, shows the way back to it, and nothing on My site itself', () => {
    path.current = '/manage/headline';
    const { unmount } = render(<ScreenTabs nav={nav} />);
    expect(screen.getByRole('link', { name: 'Back to My site' })).toHaveAttribute('href', '/manage/site');
    unmount();
    path.current = '/manage/site';
    const { container } = render(<ScreenTabs nav={nav} />);
    expect(container).toBeEmptyDOMElement();
    path.current = '/manage';
  });
});

describe('BottomBar', () => {
  it('puts Home and the next three groups in thumb reach, then Menu', () => {
    path.current = '/manage';
    render(<BottomBar nav={nav} menuOpen={false} onMenu={() => {}} />);
    expect(screen.getAllByRole('link').map((a) => a.textContent)).toEqual(['Home', 'Products', 'Events', 'My site']);
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false');
  });
});
