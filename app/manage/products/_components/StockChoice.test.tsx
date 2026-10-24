import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { StockCell, StockChoice } from './StockChoice';

afterEach(cleanup);

describe('StockChoice — how a piece is stocked (Alex, 2026-10-22)', () => {
  it('asks plainly and shows only the number the choice needs', () => {
    const onChange = vi.fn();
    const { rerender } = render(<StockChoice kind="made_to_order" stock="" onChange={onChange} />);
    expect(screen.getByRole('radio', { name: /Made to order/ })).toBeChecked();
    expect(screen.getByLabelText(/Ready now/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Ready now/), { target: { value: '1' } });
    expect(onChange).toHaveBeenLastCalledWith({ stockKind: 'made_to_order', stock: '1' });

    rerender(<StockChoice kind="count" stock="4" onChange={onChange} />);
    expect(screen.getByLabelText('How many you have')).toHaveValue('4');
    fireEvent.change(screen.getByLabelText('How many you have'), { target: { value: '5' } });
    expect(onChange).toHaveBeenLastCalledWith({ stockKind: 'count', stock: '5' });

    rerender(<StockChoice kind="one_of_a_kind" stock="1" onChange={onChange} />);
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('starts a new piece with nothing picked and no number asked (Alex, 2026-10-24)', () => {
    const onChange = vi.fn();
    render(<StockChoice kind={null} stock="" onChange={onChange} />);
    for (const r of screen.getAllByRole('radio')) expect(r).not.toBeChecked();
    expect(screen.queryByRole('textbox')).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: /I have some/ }));
    expect(onChange).toHaveBeenLastCalledWith({ stockKind: 'count', stock: '' });
  });

  it('starts one of a kind at its one piece, unless it has already sold', () => {
    const onChange = vi.fn();
    const { rerender } = render(<StockChoice kind="count" stock="6" onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: /One of a kind/ }));
    expect(onChange).toHaveBeenLastCalledWith({ stockKind: 'one_of_a_kind', stock: '1' });
    rerender(<StockChoice kind="count" stock="0" onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: /One of a kind/ }));
    expect(onChange).toHaveBeenLastCalledWith({ stockKind: 'one_of_a_kind', stock: '0' });
    rerender(<StockChoice kind="one_of_a_kind" stock="0" onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: /I have some/ }));
    expect(onChange).toHaveBeenLastCalledWith({ stockKind: 'count', stock: '0' });
    expect(screen.getByText(/This one has sold/)).toBeTruthy();
  });
});

describe('StockCell — one combination', () => {
  it('picks the kind and the number for a combination', () => {
    const onChange = vi.fn();
    const { rerender } = render(<StockCell what="Small" kind="count" stock="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('How many Small'), { target: { value: '3' } });
    expect(onChange).toHaveBeenLastCalledWith({ stockKind: 'count', stock: '3' });
    fireEvent.change(screen.getByLabelText('How you stock Small'), { target: { value: 'made_to_order' } });
    expect(onChange).toHaveBeenLastCalledWith({ stockKind: 'made_to_order', stock: '' });
    rerender(<StockCell what="Small" kind="one_of_a_kind" stock="0" onChange={onChange} />);
    expect(screen.getByText('Sold')).toBeTruthy();
    rerender(<StockCell what="Small" kind="one_of_a_kind" stock="1" onChange={onChange} />);
    expect(screen.getByText('Just one')).toBeTruthy();
  });
});
