// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { FounderSite } from '@/lib/founder/sites';
import { SiteTable } from './SiteTable';
import { MessageList } from './messages/MessageList';

const site = (over: Partial<FounderSite>): FounderSite => ({ id: 'a', name: 'Rustic Flags', subdomain: 'rustic-flags', status: 'active', plan: 'full', planComp: null, maker: 'maker@example.com', paying: { cents: 25000, interval: 'year' }, joined: '2026-11-01T15:00:00Z', ...over });

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
  it('gives a draft no link, and says who pays nothing and why', () => {
    render(<SiteTable sites={[site({ id: 'b', status: 'draft', maker: null, paying: null }), site({ id: 'c', paying: null, planComp: 'free' }), site({ id: 'd', paying: null, planComp: 'other' })]} />);
    expect(screen.getByText('Just you')).toBeInTheDocument();
    expect(screen.getByText('Nothing')).toBeInTheDocument();
    expect(screen.getByText('Free site')).toBeInTheDocument();
    expect(screen.getByText('other')).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(2);
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
