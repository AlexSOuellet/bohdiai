import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ProductOptions, initialChoices } from './ProductOptions';
import { DEFAULT_STRINGS } from './defaults';
import type { CatalogVariation, ProductOffer } from '../content';

afterEach(cleanup);

const variations: CatalogVariation[] = [{ name: 'Size', options: ['Small', 'Large'] }];
const offers: ProductOffer[] = [
  { choices: { Size: 'Small' }, price: '$24', soldOut: true },
  { choices: { Size: 'Large' }, price: '$30', soldOut: false },
];

describe('initialChoices', () => {
  it('starts on the first combination that can be bought', () => {
    expect(initialChoices(variations, offers)).toEqual({ Size: 'Large' });
  });
  it('falls back to the first choices when nothing is offered', () => {
    expect(initialChoices(variations, [])).toEqual({ Size: 'Small' });
  });
});

describe('ProductOptions', () => {
  it('shows the chosen combination’s price and whether it can be bought', () => {
    render(<ProductOptions variations={variations} offers={offers} fallbackPrice="$24" />);
    expect(screen.getByText('$30')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: DEFAULT_STRINGS.productAddToCart })).toBeEnabled();
    fireEvent.change(screen.getByLabelText('Size'), { target: { value: 'Small' } });
    expect(screen.getByText('$24')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: DEFAULT_STRINGS.productSoldOut })).toBeDisabled();
  });
  it('says a combination isn’t available when the maker turned it off', () => {
    render(<ProductOptions variations={[{ name: 'Size', options: ['Small', 'Large'] }]} offers={[offers[1]!]} fallbackPrice="$24" />);
    fireEvent.change(screen.getByLabelText('Size'), { target: { value: 'Small' } });
    expect(screen.getByRole('button', { name: DEFAULT_STRINGS.productUnavailable })).toBeDisabled();
    expect(screen.getByText('$24')).toBeInTheDocument();
  });
});
