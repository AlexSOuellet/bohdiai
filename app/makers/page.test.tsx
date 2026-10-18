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
  it('puts the looks under the opening, builds up the plans before pricing them, and ends with custom sites, questions and the form', () => {
    const { container } = render(<MakersPage />);
    const ids = [...container.querySelectorAll('main > section[id]')].map((el) => el.id);
    expect(ids).toEqual(['looks', 'ladder', 'how', 'plans', 'compare', 'custom', 'questions', 'contact']);
    const ladder = container.querySelector('#ladder');
    expect([...(ladder?.querySelectorAll('h3') ?? [])].map((h) => h.textContent)).toEqual(['Be found', 'Sell at your markets', 'Sell online too']);
    expect(ladder).toHaveTextContent('Everything in Maker Showcase, plus');
    expect(screen.getByRole('heading', { name: 'One shop, every mood' })).toBeInTheDocument();
    const starts = screen.getAllByRole('link', { name: 'Start your site →' });
    // the header, the opening and the close open the bare form; each plan card opens it with its plan
    expect(starts.filter((a) => a.getAttribute('href') === '/start')).toHaveLength(3);
    expect(screen.queryByText('Trades & services')).toBeNull();
  });

  it('leads with the pitch and shows all three maker plans', () => {
    render(<MakersPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Your work online the way you sell it');
    expect(screen.queryByText(/real web developer/i)).toBeNull();
    expect(screen.getByRole('article', { name: 'Maker Showcase' })).toHaveTextContent('$5');
    expect(screen.getByRole('article', { name: 'Maker Market' })).toHaveTextContent('$15');
    expect(screen.getByRole('article', { name: 'Maker Full' })).toHaveTextContent('$25');
  });

  it('never shows contractor plans or prices', () => {
    const { container } = render(<MakersPage />);
    expect(container.textContent).not.toMatch(/Contractor (Lite|Full)|\$30\b|\$300\b/);
  });

  it('compares against Etsy, shows Penny’s shop as a custom site, and ends in the form', () => {
    const { container } = render(<MakersPage />);
    expect(screen.getByText('Etsy')).toBeInTheDocument();
    expect(container.querySelector('#custom')).toHaveTextContent('Decoupage Digital Designs');
    expect(container.querySelector('#work')).toBeNull();
    expect(screen.getByText('Publish it')).toBeInTheDocument();
    // The close invites them to the sign-up form; the question box has no plan or business picker.
    expect(container.querySelector('#contact a[href="/start"]')).not.toBeNull();
    expect(container.querySelector('#contact')).toHaveTextContent('Questions, or want a custom site?');
    expect(container.querySelector('#contact')).not.toHaveTextContent(/which plan|what kind of business/i);
    expect(screen.queryByText('I build it and show you')).toBeNull();
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
