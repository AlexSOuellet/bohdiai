import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServiceList } from './ServiceList';
import { QuoteRotator } from '../QuoteRotator';

const photo = (n: string) => ({ kind: 'still' as const, url: `https://example.com/${n}.webp`, alt: `${n} photo` });

describe('blueprint service list', () => {
  const items = [
    { name: 'Kitchens', detail: 'Cabinets and counters.', photo: photo('kitchen'), tags: ['Cabinets'] },
    { name: 'Bathrooms', detail: 'Showers and tile.', photo: photo('bath') },
    { name: 'Repairs', detail: 'The little jobs.' },
  ];

  it('starts on the first service with its photo and detail', () => {
    render(<ServiceList items={items} />);
    expect(screen.getByRole('button', { name: 'Kitchens' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('img', { name: 'kitchen photo' })).toBeInTheDocument();
    expect(screen.getByText('Cabinets and counters.')).toBeInTheDocument();
  });

  it('shows the photo of whichever service you point at, and keeps the last photo for one without', async () => {
    const user = userEvent.setup();
    render(<ServiceList items={items} />);
    await user.hover(screen.getByRole('button', { name: 'Bathrooms' }));
    expect(screen.getByRole('img', { name: 'bath photo' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Repairs' }));
    expect(screen.getByText('The little jobs.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'bath photo' })).toBeInTheDocument();
  });
});

describe('blueprint quote rotator', () => {
  const items = [
    { quote: 'First words.', author: 'Robin L.' },
    { quote: 'Second words.', author: 'Tina' },
  ];

  it('shows one review at a time and the arrows wrap', async () => {
    const user = userEvent.setup();
    render(<QuoteRotator items={items} prefix="bp" />);
    expect(screen.getByText('“First words.”')).toBeInTheDocument();
    expect(screen.queryByText('“Second words.”')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Next review' }));
    expect(screen.getByText('“Second words.”')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next review' }));
    expect(screen.getByText('“First words.”')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Previous review' }));
    expect(screen.getByText('“Second words.”')).toBeInTheDocument();
  });

  it('shows no arrows for a single review', () => {
    render(<QuoteRotator items={items.slice(0, 1)} prefix="bp" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
