import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ProductTable } from './ProductTable';
import type { ProductRowView } from '@/lib/backend/catalog/queries';

const row = (id: string, name: string, status: ProductRowView['status'], over: Partial<ProductRowView> = {}): ProductRowView => ({
  id, name, status, priceLabel: '$24', stockLabel: 'Made to order', soldOut: false, photoUrl: null, photoUploadId: null, collectionIds: [], ...over,
});
const rows = [row('1', 'Fig Candle', 'active', { photoUrl: 'https://x/1.webp' }), row('2', 'Pine Soap', 'draft'), row('3', 'Old Mug', 'archived')];

describe('ProductTable', () => {
  it('lists current products with a link to edit each, hiding archived ones', () => {
    render(<ProductTable products={rows} />);
    expect(screen.getByRole('link', { name: 'Fig Candle' })).toHaveAttribute('href', '/manage/products/1');
    expect(screen.getByRole('link', { name: 'Pine Soap' })).toBeInTheDocument();
    expect(screen.queryByText('Old Mug')).toBeNull();
    expect(within(screen.getByRole('row', { name: /Fig Candle/ })).getByText('Live')).toBeInTheDocument();
  });
  it('filters by name and by status', () => {
    render(<ProductTable products={rows} />);
    fireEvent.change(screen.getByLabelText('Find a product'), { target: { value: 'pine' } });
    expect(screen.queryByText('Fig Candle')).toBeNull();
    expect(screen.getByText('Pine Soap')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Find a product'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Show'), { target: { value: 'archived' } });
    expect(screen.getByText('Old Mug')).toBeInTheDocument();
    expect(screen.queryByText('Fig Candle')).toBeNull();
  });
  it('says when nothing matches, and when there is nothing yet', () => {
    const { rerender } = render(<ProductTable products={rows} />);
    fireEvent.change(screen.getByLabelText('Find a product'), { target: { value: 'zzz' } });
    expect(screen.getByText('No products match.')).toBeInTheDocument();
    rerender(<ProductTable products={[]} />);
    expect(screen.getByText('No products yet. Add your first one to get started.')).toBeInTheDocument();
  });
});
