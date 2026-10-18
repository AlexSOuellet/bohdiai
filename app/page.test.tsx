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

  it('links the Facebook page from the footer, in a new tab, and names it for Google', () => {
    const { container } = render(<HomePage />);
    const fb = within(screen.getByRole('contentinfo')).getByRole('link', { name: 'Facebook' });
    expect(fb).toHaveAttribute('href', 'https://www.facebook.com/bohdiai');
    expect(fb).toHaveAttribute('target', '_blank');
    const ld = JSON.parse(container.querySelector('script[type="application/ld+json"]')?.textContent ?? '{}') as { sameAs?: string[] };
    expect(ld.sameAs).toEqual(['https://www.facebook.com/bohdiai']);
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

  it('shows the two real clients, Penny first, and no sample shelf (the samples live on the arms)', () => {
    render(<HomePage />);
    const clients = screen.getByRole('region', { name: 'Client sites' });
    expect(within(clients).getByRole('heading', { level: 3 })).toHaveTextContent('Decoupage Digital Designs');
    fireEvent.click(within(clients).getByRole('button', { name: 'Next client' }));
    expect(within(clients).getByRole('heading', { level: 3 })).toHaveTextContent('Cut-Pro Lawncare & Construction');
    expect(screen.queryByText(/not real businesses/i)).toBeNull();
  });

  it('keeps the promises next to the form, now that prices are public', () => {
    render(<HomePage />);
    expect(screen.queryByText(/know the full price before I start/i)).toBeNull();
    expect(screen.queryByText(/you pay nothing until your site is live/i)).toBeNull();
    expect(screen.getByText('One small monthly price')).toBeInTheDocument();
    expect(screen.getByText(/never take a cut of your sales/i)).toBeInTheDocument();
  });

  it('opens two doors under the hero, and a word for charities', () => {
    render(<HomePage />);
    const doors = screen.getByRole('navigation', { name: /choose your path/i });
    const [makers, service] = [...doors.querySelectorAll('a')];
    expect(makers).toHaveTextContent(/I make things/);
    expect(makers?.getAttribute('href')).toMatch(/^https?:\/\/makers\.(bohdiai\.com|localhost)/);
    expect(service).toHaveTextContent(/I fix things/);
    expect(service?.getAttribute('href')).toMatch(/^https?:\/\/service\.(bohdiai\.com|localhost)/);
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

  it('leaves how it works and the trades to the arms', () => {
    const { container } = render(<HomePage />);
    expect(screen.queryByText('Pick your plan')).toBeNull();
    expect(container.querySelector('#who-for')).toBeNull();
  });
});
