import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SAMPLES } from '@/lib/site/work';

// eslint-disable-next-line @next/next/no-img-element -- a plain img stands in for next/image in tests
vi.mock('next/image', () => ({ default: (p: { alt: string; src: string }) => <img alt={p.alt} src={p.src} /> }));
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams('') }));
const { default: SamplesPage } = await import('./page');

describe('bohdiai.com/samples', () => {
  it('shows every sample, linked to its live site, labelled as samples', () => {
    const { container } = render(<SamplesPage />);
    expect(screen.getByText(/not real businesses/i)).toBeInTheDocument();
    for (const s of SAMPLES) expect(container.querySelector(`a[href="${s.url}"]`)).not.toBeNull();
  });

  it('groups them by plan in selling order, under the plan names from the pricing pages', () => {
    const { container } = render(<SamplesPage />);
    expect([...container.querySelectorAll('section[aria-labelledby^="samples-"] h2')].map((h) => h.textContent)).toEqual([
      'Maker Showcase',
      'Maker Lite',
      'Maker Full',
      'Contractor Lead Generation',
      'Contractor Full',
    ]);
  });
});
