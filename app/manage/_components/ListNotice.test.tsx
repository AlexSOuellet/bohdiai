import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { listNotice, ListNotice } from './ListNotice';

describe('listNotice', () => {
  it('says what was saved', () => {
    expect(listNotice({ saved: 'Fig Candle' })).toBe('Saved “Fig Candle”.');
  });
  it('says what was archived', () => {
    expect(listNotice({ archived: 'Fig Candle' })).toBe('Archived “Fig Candle”.');
  });
  it('says nothing without a name', () => {
    expect(listNotice({})).toBeNull();
    expect(listNotice({ saved: '   ' })).toBeNull();
    expect(listNotice({ other: 'x' })).toBeNull();
  });
  it('takes the first value when the name is repeated', () => {
    expect(listNotice({ saved: ['Fig Candle', 'Other'] })).toBe('Saved “Fig Candle”.');
  });
  it('caps a long name at 120 characters', () => {
    expect(listNotice({ saved: 'x'.repeat(500) })).toBe(`Saved “${'x'.repeat(120)}”.`);
  });
});

describe('ListNotice', () => {
  it('shows the message as a status', () => {
    render(<ListNotice message="Saved “Fig Candle”." />);
    expect(screen.getByRole('status')).toHaveTextContent('Saved “Fig Candle”.');
  });
  it('shows a name with markup as plain text', () => {
    render(<ListNotice message={listNotice({ saved: '<b>Fig</b>' })} />);
    expect(screen.getByRole('status')).toHaveTextContent('Saved “<b>Fig</b>”.');
    expect(screen.getByRole('status').querySelector('b')).toBeNull();
  });
  it('renders nothing without a message', () => {
    const { container } = render(<ListNotice message={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
