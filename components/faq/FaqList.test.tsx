import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FaqList } from './FaqList';
import { faqItem } from '@/lib/site/faq';

const items = [faqItem('contract'), faqItem('upgrade')];

describe('FaqList', () => {
  it('shows each question as a tap-to-open line with its answer inside', () => {
    const { container } = render(<FaqList items={items} />);
    const details = container.querySelectorAll('details');
    expect(details).toHaveLength(2);
    expect(details[0]?.querySelector('summary')).toHaveTextContent('Is there a contract?');
    expect(details[0]).toHaveTextContent(/stop whenever you want/);
    expect(details[0]?.open).toBe(false);
  });

  it('can open the first question', () => {
    const { container } = render(<FaqList items={items} openFirst />);
    expect(container.querySelectorAll('details')[0]?.open).toBe(true);
    expect(container.querySelectorAll('details')[1]?.open).toBe(false);
  });

  it('gives each question an anchor for linking', () => {
    const { container } = render(<FaqList items={items} />);
    expect(container.querySelector('details#contract')).not.toBeNull();
    expect(screen.getByText('Can I move up a plan?')).toBeInTheDocument();
  });

  it('shows an answer’s link, opening in a new tab', () => {
    render(<FaqList items={[faqItem('own-domain')]} />);
    const a = screen.getByRole('link', { name: /cloudflare domains/i });
    expect(a).toHaveAttribute('href', 'https://www.cloudflare.com/products/registrar/');
    expect(a).toHaveAttribute('target', '_blank');
  });
});
