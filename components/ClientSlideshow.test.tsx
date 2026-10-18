import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CLIENTS } from '@/lib/site/work';

// eslint-disable-next-line @next/next/no-img-element -- a plain img stands in for next/image in tests
vi.mock('next/image', () => ({ default: (p: { alt: string; src: string }) => <img alt={p.alt} src={p.src} /> }));
const { ClientSlideshow } = await import('./ClientSlideshow');

const heading = (): string | null => screen.getByRole('heading', { level: 3 }).textContent;

describe('ClientSlideshow', () => {
  it('shows one client at a time, starting with the first, with its testimonials', () => {
    render(<ClientSlideshow clients={CLIENTS} />);
    expect(heading()).toBe('Decoupage Digital Designs');
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(1);
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText(/Penny C\./)).toBeInTheDocument();
  });

  it('moves forward and back with the arrows, wrapping at both ends', async () => {
    const user = userEvent.setup();
    render(<ClientSlideshow clients={CLIENTS} />);
    await user.click(screen.getByRole('button', { name: 'Next client' }));
    expect(heading()).toBe('Cut-Pro Lawncare & Construction');
    expect(screen.getByRole('link', { name: /visit the site/i })).toHaveAttribute('href', 'https://cut-pro-lawncare.bohdiai.com');
    await user.click(screen.getByRole('button', { name: 'Next client' }));
    expect(heading()).toBe('Decoupage Digital Designs');
    await user.click(screen.getByRole('button', { name: 'Previous client' }));
    expect(heading()).toBe('Cut-Pro Lawncare & Construction');
  });

  it('answers the keyboard arrow keys', () => {
    render(<ClientSlideshow clients={CLIENTS} />);
    const carousel = screen.getByRole('region', { name: 'Client sites' });
    fireEvent.keyDown(carousel, { key: 'ArrowRight' });
    expect(heading()).toBe('Cut-Pro Lawncare & Construction');
    fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
    expect(heading()).toBe('Decoupage Digital Designs');
  });

  it('shows no arrows when there is only one client', () => {
    render(<ClientSlideshow clients={CLIENTS.slice(0, 1)} />);
    expect(screen.queryByRole('button', { name: /client$/i })).toBeNull();
    expect(heading()).toBe('Decoupage Digital Designs');
  });
});
