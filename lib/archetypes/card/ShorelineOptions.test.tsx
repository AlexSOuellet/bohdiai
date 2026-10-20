import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { keyWords } from '@/lib/site-words/words';
import { CARD_WORD_SPOTS, CARD_WORDS_PREFIX } from './words';
import { ShorelineOptions } from './ShorelineOptions';

const K = keyWords(CARD_WORD_SPOTS, CARD_WORDS_PREFIX);
const W = { ...K.shoreline, choiceSoldOut: '{value} sold out', choiceUnavailable: '{value} not available' };
const L = '00000000-0000-4000-8000-000000000001';
const V = '00000000-0000-4000-8000-0000000000b1';
const variations = [{ name: 'Size', options: ['Small', 'Large', 'Huge'] }];
const offers = [
  { id: V, choices: { Size: 'Small' }, price: '$24', priceCents: 2400, soldOut: false },
  { id: 'v2', choices: { Size: 'Large' }, price: '$30', priceCents: 3000, soldOut: true },
];

afterEach(() => {
  cleanup();
  document.cookie = 'bohdi_cart=; Max-Age=0; Path=/';
});

describe('ShorelineOptions', () => {
  it('shows each option with the chosen price, and marks what can’t be had', () => {
    render(<ShorelineOptions variations={variations} offers={offers} fallbackPrice="$24" W={W} />);
    expect(screen.getByText('$24')).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Large sold out' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Huge not available' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Size'), { target: { value: 'Large' } });
    expect(screen.getByText('$30')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
  it('puts the chosen option in the cart on a shop that sells online, and says when it can’t', () => {
    render(<ShorelineOptions variations={variations} offers={offers} fallbackPrice="$24" W={W} listingId={L} />);
    fireEvent.click(screen.getByRole('button', { name: W.cart.add }));
    expect(document.cookie).toContain(`${L}~${V}`);
    fireEvent.change(screen.getByLabelText('Size'), { target: { value: 'Large' } });
    expect(screen.getByText(W.soldOut)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Size'), { target: { value: 'Huge' } });
    expect(screen.getByText(W.unavailable)).toBeTruthy();
  });
});
