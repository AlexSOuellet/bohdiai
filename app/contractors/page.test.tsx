import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// eslint-disable-next-line @next/next/no-img-element -- a plain img stands in for next/image in tests
vi.mock('next/image', () => ({ default: (p: { alt: string; src: string }) => <img alt={p.alt} src={p.src} /> }));
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams('') }));
const { default: ContractorsPage } = await import('./page');

describe('bohdiai.com/contractors', () => {
  it('leads with the pitch and shows both contractor plans', () => {
    render(<ContractorsPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'A real web developer for less than a site builder',
    );
    expect(screen.getByRole('article', { name: 'Contractor Lead Generation' })).toHaveTextContent('$10');
    expect(screen.getByRole('article', { name: 'Contractor Full' })).toHaveTextContent('$30');
  });

  it('never shows maker plans or prices', () => {
    const { container } = render(<ContractorsPage />);
    expect(container.textContent).not.toMatch(/Maker (Showcase|Lite|Full)|\$5\b|\$20\b|\$200\b/);
  });

  it('compares against the lead services, shows Cut-Pro and ends in the form', () => {
    const { container } = render(<ContractorsPage />);
    expect(screen.getByText('Angi, HomeAdvisor or Thumbtack')).toBeInTheDocument();
    expect(screen.getAllByText('Cut-Pro Lawncare & Construction').length).toBeGreaterThan(0);
    expect(screen.queryByText('Decoupage Digital Designs')).toBeNull();
    expect(container.querySelector('#contact form')).not.toBeNull();
  });

  it('shows only the contractor samples, labelled as samples', () => {
    const { container } = render(<ContractorsPage />);
    expect(screen.getByText(/not real businesses/i)).toBeInTheDocument();
    expect(container.querySelector('#work a[href="https://true-coat-painting.bohdiai.com"]')).not.toBeNull();
    expect(container.querySelector('#work a[href="https://halfmoon-roofing.bohdiai.com"]')).not.toBeNull();
    expect(container.querySelector('#work a[href="https://rustic-rhody.bohdiai.com"]')).toBeNull();
  });

  it('never talks about AI', () => {
    const { container } = render(<ContractorsPage />);
    expect((container.textContent ?? '').replace(/BohdiAI/g, '')).not.toMatch(/\bAI\b/);
  });
});

describe('bohdiai.com/contractors — questions', () => {
  it('answers the three most-asked questions and links the full FAQ', () => {
    render(<ContractorsPage />);
    expect(screen.getByText('Do I have to pay for leads?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /full faq/i })).toHaveAttribute('href', '/faq');
  });
});
