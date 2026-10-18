import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HERO_WORK } from '@/lib/site/work';

// eslint-disable-next-line @next/next/no-img-element -- a plain img stands in for next/image in tests
vi.mock('next/image', () => ({ default: (p: { alt: string; src: string }) => <img alt={p.alt} src={p.src} /> }));
const { WorkBrowser } = await import('./WorkBrowser');

describe('WorkBrowser', () => {
  it('starts on the first sample with its real address, screenshot and live link', () => {
    render(<WorkBrowser />);
    expect(screen.getByText('classic-loafs.bohdiai.com')).toBeInTheDocument();
    expect(screen.getByText('Sample · Classic Loafs')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Classic Loafs home page' })).toHaveAttribute('src', '/work/classic-loafs.webp');
    expect(screen.getByRole('link', { name: /visit the live site/i })).toHaveAttribute('href', 'https://classic-loafs.bohdiai.com');
  });

  it('shows no client sites; they live in the work section', () => {
    render(<WorkBrowser />);
    expect(screen.queryByRole('button', { name: /show cut-pro/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /show decoupage/i })).toBeNull();
  });

  it('labels samples as samples when you jump to one', async () => {
    render(<WorkBrowser />);
    const button = screen.getByRole('button', { name: /show saltmarsh & lace/i });
    await userEvent.setup().click(button);
    expect(screen.getByText('Sample · Saltmarsh & Lace')).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('link', { name: /visit the live site/i })).toHaveAttribute('href', 'https://saltmarsh-and-lace.bohdiai.com');
  });

  it('has one pager button per site', () => {
    render(<WorkBrowser />);
    expect(screen.getAllByRole('button', { name: /^show /i })).toHaveLength(HERO_WORK.length);
  });
});
