import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';

// eslint-disable-next-line @next/next/no-img-element -- a plain img stands in for next/image in tests
vi.mock('next/image', () => ({ default: (p: { alt: string; src: string }) => <img alt={p.alt} src={p.src} /> }));
const { default: HomePage } = await import('./page');

describe('bohdiai.com home', () => {
  it('leads with the slogan and ends in the contact form', () => {
    const { container } = render(<HomePage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'If you make it, bake it, fix it or fund it, we build it for you',
    );
    expect(container.querySelector('#work')).not.toBeNull();
    expect(container.querySelector('#contact form')).not.toBeNull();
  });

  it('says nothing about the waitlist, beta, Skool or founder spots', () => {
    const { container } = render(<HomePage />);
    expect(container.textContent).not.toMatch(
      /waitlist|beta|skool|founder spot|reserve your shop|built by ai|live in minutes|youtube/i,
    );
  });

  it('never talks about AI; the only "AI" on the page is the BohdiAI name', () => {
    const { container } = render(<HomePage />);
    const text = (container.textContent ?? '').replace(/BohdiAI/g, '');
    expect(text).not.toMatch(/\bAI\b/);
    expect(text).not.toMatch(/artificial intelligence/i);
    expect(screen.getByText(/The Bohdi Way/)).toBeInTheDocument();
  });

  it('shows the clients in a slideshow, one at a time, and labels the samples as samples', () => {
    render(<HomePage />);
    const clients = screen.getByRole('region', { name: 'Client sites' });
    expect(within(clients).getByRole('heading', { level: 3 })).toHaveTextContent('Cut-Pro Lawncare & Construction');
    fireEvent.click(within(clients).getByRole('button', { name: 'Next client' }));
    expect(within(clients).getByRole('heading', { level: 3 })).toHaveTextContent('Decoupage Digital Designs');
    expect(screen.getByText(/not real businesses/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /see more samples/i })).toHaveAttribute('href', '/samples');
  });

  it('keeps the promises next to the form, now that prices are public', () => {
    render(<HomePage />);
    expect(screen.queryByText(/know the full price before I start/i)).toBeNull();
    expect(screen.getByText(/built free\. you pay nothing until your site is live/i)).toBeInTheDocument();
    expect(screen.getByText(/never take a cut of your sales/i)).toBeInTheDocument();
  });

  it('opens two doors under the hero, and a word for charities', () => {
    render(<HomePage />);
    const doors = screen.getByRole('navigation', { name: /choose your path/i });
    expect(doors.querySelector('a[href="/makers"]')).toHaveTextContent(/I make things/);
    expect(doors.querySelector('a[href="/contractors"]')).toHaveTextContent(/I run a service business/);
    expect(screen.getByRole('link', { name: /charity or community group/i })).toHaveAttribute('href', '#contact');
  });

  it('tells the name story in the About and links the questions page', () => {
    const { container } = render(<HomePage />);
    expect(screen.getByText(/Bodhi means awakening/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /why my prices are so low/i })).toHaveAttribute('href', '/faq#why-so-low');
    expect(container.querySelector('footer a[href="/faq"]')).toHaveTextContent('FAQ');
  });

  it('puts plans and prices one tap from the top', () => {
    render(<HomePage />);
    expect(screen.getByRole('link', { name: 'See plans and prices' })).toHaveAttribute('href', '#pricing');
  });

  it('leads the header with Pricing and FAQ, and has a phone menu', () => {
    const { container } = render(<HomePage />);
    const main = screen.getByRole('navigation', { name: 'Main' });
    expect([...main.querySelectorAll('a')].map((a) => a.textContent).slice(0, 2)).toEqual(['Pricing', 'FAQ']);
    expect(main.querySelector('a[href="/#pricing"]')).not.toBeNull();
    expect(main.querySelector('a[href="/faq"]')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
    expect(container.querySelector('#pricing nav')).not.toBeNull();
  });

  it('no longer says where it was built', () => {
    const { container } = render(<HomePage />);
    expect(container.querySelector('footer')?.textContent).not.toMatch(/Built in Rhode Island/);
  });

  it('explains how it works with plans and billing at go-live', () => {
    render(<HomePage />);
    expect(screen.getByText('Pick your plan')).toBeInTheDocument();
    expect(screen.getByText(/billing starts the day your site goes live/i)).toBeInTheDocument();
  });
});
