import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// eslint-disable-next-line @next/next/no-img-element -- a plain img stands in for next/image in tests
vi.mock('next/image', () => ({ default: (p: { alt: string; src: string }) => <img alt={p.alt} src={p.src} /> }));
const { WorkBrowser } = await import('./WorkBrowser');

describe('WorkBrowser', () => {
  it('starts on the first client with its real address, screenshot and live link', () => {
    render(<WorkBrowser />);
    expect(screen.getByText('cut-pro-lawncare.bohdiai.com')).toBeInTheDocument();
    expect(screen.getByText('Client · Cut-Pro Lawncare & Construction')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Cut-Pro Lawncare & Construction home page' })).toHaveAttribute('src', '/work/cut-pro-lawncare.webp');
    expect(screen.getByRole('link', { name: /visit the live site/i })).toHaveAttribute('href', 'https://cut-pro-lawncare.bohdiai.com');
  });

  it('labels samples as samples when you jump to one', async () => {
    render(<WorkBrowser />);
    const button = screen.getByRole('button', { name: /show twilight to darkness/i });
    await userEvent.setup().click(button);
    expect(screen.getByText('Sample · Twilight to Darkness')).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('link', { name: /visit the live site/i })).toHaveAttribute('href', 'https://twilight-to-darkness.bohdiai.com');
  });

  it('has one pager button per site', () => {
    render(<WorkBrowser />);
    expect(screen.getAllByRole('button', { name: /^show /i })).toHaveLength(5);
  });
});
