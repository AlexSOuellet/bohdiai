import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// eslint-disable-next-line @next/next/no-img-element -- a plain img stands in for next/image in tests
vi.mock('next/image', () => ({ default: (p: { alt: string; src: string }) => <img alt={p.alt} src={p.src} /> }));
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams('') }));
const { default: MakersPage } = await import('./page');

describe('bohdiai.com/makers', () => {
  it('leads with the pitch and shows both maker plans', () => {
    render(<MakersPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'A real web developer for less than a site builder',
    );
    expect(screen.getByRole('article', { name: 'Maker Lite' })).toHaveTextContent('$14.99');
    expect(screen.getByRole('article', { name: 'Maker Full' })).toHaveTextContent('$19.99');
  });

  it('never shows contractor plans or prices', () => {
    const { container } = render(<MakersPage />);
    expect(container.textContent).not.toMatch(/Contractor (Lite|Full)|\$29\.99|\$299\b/);
  });

  it('compares against Etsy, shows Penny’s shop and ends in the form', () => {
    const { container } = render(<MakersPage />);
    expect(screen.getByText('Etsy')).toBeInTheDocument();
    expect(screen.getAllByText('Decoupage Digital Designs').length).toBeGreaterThan(0);
    expect(screen.queryByText('Cut-Pro Lawncare & Construction')).toBeNull();
    expect(container.querySelector('#contact form')).not.toBeNull();
  });

  it('never talks about AI', () => {
    const { container } = render(<MakersPage />);
    expect((container.textContent ?? '').replace(/BohdiAI/g, '')).not.toMatch(/\bAI\b/);
  });
});

describe('bohdiai.com/makers — questions', () => {
  it('answers the three most-asked questions and links the full FAQ', () => {
    render(<MakersPage />);
    expect(screen.getByText('Why are your prices so low compared to everyone else?')).toBeInTheDocument();
    expect(screen.getByText('Do I have to sell online?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /more questions/i })).toHaveAttribute('href', '/faq');
  });
});
