import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ProductOptions, initialChoices } from './ProductOptions';
import { DEFAULT_STRINGS, DEFAULT_COUNTS } from './defaults';
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
  it('marks each choice with what picking it would give, keeping the raw value', () => {
    const two: CatalogVariation[] = [
      { name: 'Size', options: ['Small', 'Large'] },
      { name: 'Scent', options: ['Fig', 'Pine'] },
    ];
    const grid: ProductOffer[] = [
      { choices: { Size: 'Large', Scent: 'Fig' }, price: '$30', soldOut: false },
      { choices: { Size: 'Small', Scent: 'Fig' }, price: '$24', soldOut: true },
      { choices: { Size: 'Large', Scent: 'Pine' }, price: '$30', soldOut: false },
    ];
    render(<ProductOptions variations={two} offers={grid} fallbackPrice="$24" />);
    // Starts on Large + Fig. Small + Fig is sold out; Pine with Large is fine.
    const size = screen.getByLabelText('Size');
    expect(screen.getByRole('option', { name: DEFAULT_COUNTS.choiceSoldOut('Small') })).toHaveValue('Small');
    expect(screen.getByRole('option', { name: 'Large' })).toHaveValue('Large');
    expect(screen.getByRole('option', { name: 'Pine' })).toHaveValue('Pine');
    // On Pine, Small + Pine isn't offered at all.
    fireEvent.change(screen.getByLabelText('Scent'), { target: { value: 'Pine' } });
    expect(screen.getByRole('option', { name: DEFAULT_COUNTS.choiceUnavailable('Small') })).toHaveValue('Small');
    // On Small, Pine isn't offered and Fig is sold out.
    fireEvent.change(size, { target: { value: 'Small' } });
    expect(screen.getByRole('option', { name: DEFAULT_COUNTS.choiceUnavailable('Pine') })).toHaveValue('Pine');
    fireEvent.change(screen.getByLabelText('Scent'), { target: { value: 'Fig' } });
    expect(screen.getByRole('option', { name: DEFAULT_COUNTS.choiceSoldOut('Fig') })).toHaveValue('Fig');
    expect(size).toHaveValue('Small');
  });
  it('words the marks in plain English', () => {
    expect(DEFAULT_COUNTS.choiceSoldOut('Small')).toBe('Small — sold out');
    expect(DEFAULT_COUNTS.choiceUnavailable('Small')).toBe('Small — not available');
  });
  it('gives two pickers on one page different ids', () => {
    const { container } = render(
      <>
        <ProductOptions variations={variations} offers={offers} fallbackPrice="$24" />
        <ProductOptions variations={variations} offers={offers} fallbackPrice="$24" />
      </>,
    );
    const ids = [...container.querySelectorAll('select')].map((el) => el.id);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    for (const label of screen.getAllByText('Size')) expect(ids).toContain(label.getAttribute('for'));
  });
  it('shows no picker for an option with no choices', () => {
    const { container } = render(
      <ProductOptions variations={[{ name: 'Size', options: ['Small', 'Large'] }, { name: 'Colour', options: [] }]} offers={offers} fallbackPrice="$24" />,
    );
    expect(container.querySelectorAll('select')).toHaveLength(1);
    expect(screen.queryByText('Colour')).toBeNull();
  });
});

describe('ProductOptions on a shop that does not sell online', () => {
  it('keeps the choices and prices but asks instead of selling', () => {
    render(<ProductOptions variations={variations} offers={offers} fallbackPrice="$24" askHref="/contact" />);
    expect(screen.getByText('$30')).toBeTruthy();
    expect(screen.getByRole('link', { name: DEFAULT_STRINGS.productAskAbout }).getAttribute('href')).toBe('/contact');
    expect(screen.queryByRole('button')).toBeNull();
  });
});
