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
    expect(screen.getByRole('article', { name: 'Contractor Lite' })).toHaveTextContent('$14.99');
    expect(screen.getByRole('article', { name: 'Contractor Full' })).toHaveTextContent('$29.99');
  });

  it('never shows maker plans or prices', () => {
    const { container } = render(<ContractorsPage />);
    expect(container.textContent).not.toMatch(/Maker (Lite|Full)|\$19\.99|\$199\b/);
  });

  it('compares against the lead services, shows Cut-Pro and ends in the form', () => {
    const { container } = render(<ContractorsPage />);
    expect(screen.getByText('Angi, HomeAdvisor or Thumbtack')).toBeInTheDocument();
    expect(screen.getAllByText('Cut-Pro Lawncare & Construction').length).toBeGreaterThan(0);
    expect(screen.queryByText('Decoupage Digital Designs')).toBeNull();
    expect(screen.queryByText(/not real businesses/i)).toBeNull();
    expect(container.querySelector('#contact form')).not.toBeNull();
  });

  it('never talks about AI', () => {
    const { container } = render(<ContractorsPage />);
    expect((container.textContent ?? '').replace(/BohdiAI/g, '')).not.toMatch(/\bAI\b/);
  });
});
