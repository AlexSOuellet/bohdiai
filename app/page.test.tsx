import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';

// eslint-disable-next-line @next/next/no-img-element -- a plain img stands in for next/image in tests
vi.mock('next/image', () => ({ default: (p: { alt: string; src: string }) => <img alt={p.alt} src={p.src} /> }));
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams('') }));
vi.mock('next/headers', () => ({ headers: async () => new Headers({ host: 'bohdiai.com' }) }));
const { default: Page } = await import('./page');
const page = await Page();
const HomePage = (): React.ReactElement => page;

describe('bohdiai.com, the maker site (Session 117)', () => {
  it('puts the looks under the opening, builds up the plans before pricing them, and ends with the story, questions and the form', () => {
    const { container } = render(<HomePage />);
    const ids = [...container.querySelectorAll('main > section[id]')].map((el) => el.id);
    expect(ids).toEqual(['looks', 'ladder', 'how', 'plans', 'compare', 'custom', 'who', 'pledge', 'questions', 'contact']);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Your work online the way you sell it');
    expect(screen.getByRole('heading', { name: 'One shop, every mood' })).toBeInTheDocument();
    // the header, the opening and the close open the bare form; each paid plan card opens it with its plan
    const starts = screen.getAllByRole('link', { name: 'Start your site →' });
    expect(starts.filter((a) => a.getAttribute('href') === '/start')).toHaveLength(3);
  });

  it('starts the ladder with Free, each step building on the one before', () => {
    const { container } = render(<HomePage />);
    const ladder = container.querySelector('#ladder');
    expect([...(ladder?.querySelectorAll('h3') ?? [])].map((h) => h.textContent)).toEqual([
      'Know your numbers',
      'Be found',
      'Sell at your markets',
      'Sell online too',
    ]);
    expect(ladder).toHaveTextContent('Everything in Maker Free, plus');
    expect(ladder).toHaveTextContent('Everything in Maker Showcase, plus');
  });

  it('prices Free at $0 with its tools and no button, beside the three paid plans', () => {
    render(<HomePage />);
    const free = screen.getByRole('article', { name: 'Maker Free' });
    expect(free).toHaveTextContent('$0');
    expect(free).toHaveTextContent('Cost to make');
    expect(free).toHaveTextContent('Is this market worth it?');
    expect(free).toHaveTextContent('No website on Free');
    expect(free).not.toHaveTextContent(/What to bring/);
    expect(within(free).queryByRole('link')).toBeNull();
    expect(screen.getByRole('article', { name: 'Maker Showcase' })).toHaveTextContent('$5');
    expect(screen.getByRole('article', { name: 'Maker Market' })).toHaveTextContent('$15');
    expect(screen.getByRole('article', { name: 'Maker Full' })).toHaveTextContent('$25');
    expect(screen.getByText('Free to start, a site from $5 a month')).toBeInTheDocument();
  });

  it('says nothing about service businesses, contractors, charities or the doors', () => {
    const { container } = render(<HomePage />);
    expect(container.textContent).not.toMatch(/contractor|charit|service business|fix things|Cut-Pro|real web developer|\$30\b|\$300\b/i);
    expect(screen.queryByRole('navigation', { name: /choose your path/i })).toBeNull();
    const ld = JSON.parse(container.querySelector('script[type="application/ld+json"]')?.textContent ?? '{}') as { description?: string };
    expect(ld.description).not.toMatch(/contractor|charit/i);
  });

  it('keeps one way in for a site that isn’t a maker’s, in the question box at the end', () => {
    const { container } = render(<HomePage />);
    const close = container.querySelector('#contact');
    expect(close).toHaveTextContent('Questions, or want a custom site?');
    expect(close).toHaveTextContent('Need a site for something other than making things?');
    expect(close?.querySelector('a[href="/start"]')).not.toBeNull();
    expect(close?.querySelector('form')).not.toBeNull();
    expect(close).not.toHaveTextContent(/which plan|what kind of business/i);
  });

  it('shows Penny’s shop as a custom site and keeps the story and the pledge', () => {
    const { container } = render(<HomePage />);
    expect(container.querySelector('#custom')).toHaveTextContent('Decoupage Digital Designs');
    expect(container.querySelector('#who')).toHaveTextContent('Bodhi means awakening');
    expect(container.querySelector('#who')).not.toHaveTextContent(/sod|volunteers/);
    expect(screen.getByRole('link', { name: /why my prices are so low/i })).toHaveAttribute('href', '/faq#why-so-low');
    expect(container.querySelector('#pledge')).toHaveTextContent('never take a cut');
  });

  it('answers the most-asked questions, Free first, and links the full FAQ', () => {
    render(<HomePage />);
    expect(screen.getByText('What do I get on Free?')).toBeInTheDocument();
    expect(screen.getByText('Why are your prices so low compared to everyone else?')).toBeInTheDocument();
    expect(screen.getByText('Do I have to sell online?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /full faq/i })).toHaveAttribute('href', '/faq');
  });

  it('leads the header with the looks, links the sign-up form, and has a phone menu', () => {
    render(<HomePage />);
    const main = screen.getByRole('navigation', { name: 'Main' });
    expect([...main.querySelectorAll('a')].map((a) => a.textContent)).toEqual([
      'Looks',
      'Plans',
      'How it works',
      'Pricing',
      'Custom sites',
      'FAQ',
      'Contact',
    ]);
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
  });

  it('links the footer within bohdiai.com only, and Facebook in a new tab', () => {
    const { container } = render(<HomePage />);
    const footer = screen.getByRole('contentinfo');
    for (const a of footer.querySelectorAll('a')) {
      expect(a.getAttribute('href')).not.toMatch(/makers\.|service\./);
    }
    expect(footer).not.toHaveTextContent(/contractor|charit|service/i);
    const fb = within(footer).getByRole('link', { name: 'Facebook' });
    expect(fb).toHaveAttribute('target', '_blank');
    const ld = JSON.parse(container.querySelector('script[type="application/ld+json"]')?.textContent ?? '{}') as { sameAs?: string[] };
    expect(ld.sameAs).toEqual(['https://www.facebook.com/bohdiai']);
  });

  it('never talks about AI, the waitlist, beta or Skool', () => {
    const { container } = render(<HomePage />);
    const text = (container.textContent ?? '').replace(/BohdiAI/g, '');
    expect(text).not.toMatch(/\bAI\b/);
    expect(text).not.toMatch(/artificial intelligence|waitlist|beta|skool|youtube/i);
  });
});
