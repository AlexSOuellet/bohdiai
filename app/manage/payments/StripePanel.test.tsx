import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout
const { StripePanel } = await import('./StripePanel');

afterEach(cleanup);

describe('StripePanel', () => {
  it('offers Connect Stripe, saying plainly it isn’t set up on BohdiAI yet', () => {
    render(<StripePanel outcome={null} />);
    expect(screen.getByRole('link', { name: 'Connect Stripe' }).getAttribute('href')).toBe('/api/stripe/connect');
    expect(screen.getByText(/Stripe isn’t set up on BohdiAI yet/)).toBeTruthy();
    expect(screen.getByText(/BohdiAI never sees a card or your Stripe password/)).toBeTruthy();
  });

  it('shows what happened when Connect Stripe was pressed', () => {
    render(<StripePanel outcome={{ tone: 'error', text: 'Stripe isn’t set up on BohdiAI yet, so it can’t be connected yet.' }} />);
    expect(screen.getByText('Stripe isn’t set up on BohdiAI yet, so it can’t be connected yet.')).toBeTruthy();
    cleanup();
    render(<StripePanel outcome={{ tone: 'ok', text: 'Connected.' }} />);
    expect(screen.getByText('Connected.')).toBeTruthy();
  });
});
