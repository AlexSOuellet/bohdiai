import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// eslint-disable-next-line @next/next/no-img-element -- a plain img stands in for next/image in tests
vi.mock('next/image', () => ({ default: (p: { alt: string; src: string }) => <img alt={p.alt} src={p.src} /> }));
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams('') }));
vi.mock('next/headers', () => ({ headers: async () => new Headers({ host: 'makers.bohdiai.com' }) }));
const { default: Page } = await import('./page');
const page = await Page();
const MakersPage = (): React.ReactElement => page;

describe('makers.bohdiai.com', () => {
  it('puts the looks right under the opening, then how it works, the makers, the work, the plans', () => {
    const { container } = render(<MakersPage />);
    const ids = [...container.querySelectorAll('main > section[id]')].map((el) => el.id);
    expect(ids.slice(0, 5)).toEqual(['looks', 'how', 'who-for', 'work', 'plans']);
    expect(screen.getByRole('heading', { name: 'One shop, every mood' })).toBeInTheDocument();
    const starts = screen.getAllByRole('link', { name: 'Start your site →' });
    // the header and the opening open the bare form; each plan card opens it with its plan
    expect(starts.filter((a) => a.getAttribute('href') === '/start')).toHaveLength(2);
    expect(screen.queryByText('Trades & services')).toBeNull();
  });

  it('leads with the pitch and shows all three maker plans', () => {
    render(<MakersPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'A real web developer for less than a site builder',
    );
    expect(screen.getByRole('article', { name: 'Maker Showcase' })).toHaveTextContent('$5');
    expect(screen.getByRole('article', { name: 'Maker Market' })).toHaveTextContent('$15');
    expect(screen.getByRole('article', { name: 'Maker Full' })).toHaveTextContent('$25');
  });

  it('never shows contractor plans or prices', () => {
    const { container } = render(<MakersPage />);
    expect(container.textContent).not.toMatch(/Contractor (Lite|Full)|\$30\b|\$300\b/);
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

describe('makers.bohdiai.com — questions', () => {
  it('answers the three most-asked questions and links the full FAQ', () => {
    render(<MakersPage />);
    expect(screen.getByText('Why are your prices so low compared to everyone else?')).toBeInTheDocument();
    expect(screen.getByText('Do I have to sell online?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /full faq/i })).toHaveAttribute('href', '/faq');
  });
});
