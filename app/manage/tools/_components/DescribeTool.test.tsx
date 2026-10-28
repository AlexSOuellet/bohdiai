import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

const describePiece = vi.hoisted(() => vi.fn());
vi.mock('@/lib/tools/describe-actions', () => ({ describePiece }));
vi.mock('@/lib/backend/catalog/actions', () => ({ uploadProductPhoto: vi.fn() }));
vi.mock('next/navigation', () => ({ unstable_rethrow: () => undefined }));

import { DescribeTool } from './DescribeTool';

afterEach(() => {
  cleanup();
  describePiece.mockReset();
});

const tag = () => screen.getByRole('complementary', { name: 'Its description' });

describe('Describe it (Alex, 2026-10-28)', () => {
  it('starts blank, asking in her own words once it’s named', () => {
    render(<DescribeTool canSaveProduct />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Describe your product');
    expect(screen.getByRole('button', { name: 'Write it' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('What it’s called'), { target: { value: 'Lazy Susan' } });
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Describe Lazy Susan');
    expect(within(tag()).getByText('Fill in the piece and press Write it.')).toBeInTheDocument();
  });

  it('writes from what it’s made of, one thing a line, and saves it as a product', async () => {
    describePiece.mockResolvedValue({ ok: true, text: { short: 'A pine lazy susan.', description: 'Solid pine.' }, left: 99 });
    render(<DescribeTool canSaveProduct />);
    fireEvent.change(screen.getByLabelText('What it’s called'), { target: { value: 'Lazy Susan' } });
    fireEvent.change(screen.getByLabelText('What it’s made of'), { target: { value: 'Pine round\nDecoupage print' } });
    fireEvent.change(screen.getByLabelText('Price, if you have one'), { target: { value: '130' } });
    fireEvent.click(screen.getByRole('button', { name: 'Write it' }));
    expect(await within(tag()).findByText('A pine lazy susan.')).toBeInTheDocument();
    expect(describePiece).toHaveBeenCalledWith({ name: 'Lazy Susan', materials: ['Pine round', 'Decoupage print'], facts: '', price: '130', photoUploadId: null });
    expect(screen.getByText('99 more this month')).toBeInTheDocument();
    const q = new URL(screen.getByRole('link', { name: 'Save as a product' }).getAttribute('href') ?? '', 'https://app.bohdiai.com').searchParams;
    expect([q.get('name'), q.get('price'), q.get('short'), q.get('desc')]).toEqual(['Lazy Susan', '13000', 'A pine lazy susan.', 'Solid pine.']);
  });

  it('says why a run didn’t work, and saves nowhere without products', async () => {
    describePiece.mockResolvedValueOnce({ ok: false, error: 'You’ve used this month’s 30 descriptions.' });
    render(<DescribeTool canSaveProduct={false} />);
    fireEvent.change(screen.getByLabelText('What it’s called'), { target: { value: 'Tin' } });
    fireEvent.click(screen.getByRole('button', { name: 'Write it' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('30 descriptions');
    describePiece.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Write it' }));
    expect(await screen.findByText(/Check your connection/)).toBeInTheDocument();
    describePiece.mockResolvedValueOnce({ ok: true, text: { short: 'S', description: 'D' }, left: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Write it' }));
    expect(await screen.findByText('1 more this month')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Save as a product' })).toBeNull();
  });
});
