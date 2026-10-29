import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { allFaqItems, faqGroupsFor } from '@/lib/site/faq';

const makerItems = faqGroupsFor('maker').flatMap((g) => g.items);

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams('') }));
const { default: FaqPage } = await import('./page');

describe('bohdiai.com/faq', () => {
  it('has a headline and every maker question, Free included', () => {
    render(<FaqPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Questions, answered straight');
    for (const item of makerItems) expect(screen.getByText(item.q)).toBeInTheDocument();
    expect(screen.getByText('What do I get on Free?')).toBeInTheDocument();
  });

  it('never shows the service answers, kept with the switched-off service page (Session 117)', () => {
    const { container } = render(<FaqPage />);
    for (const item of allFaqItems().filter((i) => i.audience === 'contractor')) {
      expect(container.querySelector(`#${item.id}`)).toBeNull();
    }
    expect(container.textContent).not.toMatch(/contractor|service business|estimate request/i);
  });

  it('leads with the price question, closed until tapped', () => {
    const { container } = render(<FaqPage />);
    const first = container.querySelector('details');
    expect(first?.id).toBe('why-so-low');
    expect(first?.open).toBe(false);
    expect(container.querySelectorAll('details[open]')).toHaveLength(0);
  });

  it('describes every question for search engines', () => {
    const { container } = render(<FaqPage />);
    const ld = JSON.parse(container.querySelector('script[type="application/ld+json"]')?.textContent ?? '{}') as {
      '@type': string;
      mainEntity: unknown[];
    };
    expect(ld['@type']).toBe('FAQPage');
    expect(ld.mainEntity).toHaveLength(makerItems.length);
  });

  it('ends in the contact form and never talks about AI', () => {
    const { container } = render(<FaqPage />);
    expect(container.querySelector('#contact form')).not.toBeNull();
    expect((container.textContent ?? '').replace(/BohdiAI/g, '')).not.toMatch(/\bAI\b/);
  });
});
