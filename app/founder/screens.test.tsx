// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { FounderSite } from '@/lib/founder/sites';
import { SiteTable } from './SiteTable';
import { MessageList } from './messages/MessageList';

const site = (over: Partial<FounderSite & { openUrl: string }>): FounderSite & { openUrl: string } => ({ id: 'a', name: 'Rustic Flags', subdomain: 'rustic-flags', status: 'active', plan: 'full', planComp: null, maker: 'maker@example.com', paying: { cents: 25000, interval: 'year' }, joined: '2026-11-01T15:00:00Z', canManage: true, openUrl: 'https://rustic-flags.bohdiai.com', ...over });

describe('SiteTable', () => {
  it('shows a live paying site with its address to open', () => {
    render(<SiteTable sites={[site({})]} />);
    expect(screen.getByRole('link', { name: 'rustic-flags.bohdiai.com' })).toHaveAttribute('href', 'https://rustic-flags.bohdiai.com');
    expect(screen.getByText('Full')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText('maker@example.com')).toBeInTheDocument();
    expect(screen.getByText('$250 a year')).toBeInTheDocument();
    expect(screen.getByText('Nov 1, 2026')).toBeInTheDocument();
  });
  it('opens a draft through its private link', () => {
    render(<SiteTable sites={[site({ status: 'draft', openUrl: 'https://rustic-flags.bohdiai.com/?preview=x' })]} />);
    expect(screen.getByRole('link', { name: 'rustic-flags.bohdiai.com' })).toHaveAttribute('href', 'https://rustic-flags.bohdiai.com/?preview=x');
  });
  it('opens each site’s backend, or says Alex isn’t on it', () => {
    const { container } = render(<SiteTable sites={[site({ id: 't1' }), site({ id: 't2', name: 'Other', canManage: false })]} />);
    expect(screen.getByRole('button', { name: 'Open the backend of Rustic Flags' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open the backend of Other' })).toBeNull();
    expect(screen.getByText('Not on this site')).toBeInTheDocument();
    const form = container.querySelector('form');
    expect(form).toHaveAttribute('action', '/manage/switch-site');
    expect(form?.querySelector('input')).toHaveValue('t1');
  });
  it('says who pays nothing and why', () => {
    render(<SiteTable sites={[site({ id: 'b', maker: null, paying: null }), site({ id: 'c', paying: null, planComp: 'free' }), site({ id: 'd', paying: null, planComp: 'other' })]} />);
    expect(screen.getByText('Just you')).toBeInTheDocument();
    expect(screen.getByText('Nothing')).toBeInTheDocument();
    expect(screen.getByText('Free site')).toBeInTheDocument();
    expect(screen.getByText('other')).toBeInTheDocument();
  });
});

describe('MessageList', () => {
  it('says when there are none', () => {
    render(<MessageList messages={[]} />);
    expect(screen.getByText(/No messages yet/)).toBeInTheDocument();
  });
  it('shows who wrote and what they said', () => {
    render(<MessageList messages={[{ id: 'm', site: 'Rustic Flags', email: 'a@example.com', message: 'My photos won’t load', sent: '2026-11-01T15:00:00Z' }]} />);
    expect(screen.getByText('Rustic Flags')).toBeInTheDocument();
    expect(screen.getByText('My photos won’t load')).toBeInTheDocument();
  });
});
