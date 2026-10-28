import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

const describePiece = vi.hoisted(() => vi.fn());
const loadPieceForDescribe = vi.hoisted(() => vi.fn());
const saveDescriptionsToProduct = vi.hoisted(() => vi.fn());
const push = vi.hoisted(() => vi.fn());
vi.mock('@/lib/tools/describe-actions', () => ({ describePiece, loadPieceForDescribe, saveDescriptionsToProduct }));
vi.mock('@/lib/backend/catalog/actions', () => ({ uploadProductPhoto: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }), unstable_rethrow: () => undefined }));

import { DescribeTool } from './DescribeTool';

afterEach(() => {
  cleanup();
  describePiece.mockReset();
  loadPieceForDescribe.mockReset();
  saveDescriptionsToProduct.mockReset();
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

describe('Describe it, from one of her products (Alex, 2026-10-28)', () => {
  const products = [{ id: 'l1', name: 'Victorian Lazy Susan' }];

  it('fills in the product, writes it, and saves both descriptions back to it', async () => {
    loadPieceForDescribe.mockResolvedValue({ ok: true, piece: { id: 'l1', name: 'Victorian Lazy Susan', price: '130', materials: ['18" Round', 'Decoupage print'], photo: null } });
    describePiece.mockResolvedValue({ ok: true, text: { short: 'S', description: 'D' }, left: 5 });
    saveDescriptionsToProduct.mockResolvedValue({ ok: true });
    render(<DescribeTool canSaveProduct products={products} />);
    fireEvent.change(screen.getByLabelText('Start from one of your products'), { target: { value: 'l1' } });
    await vi.waitFor(() => expect(screen.getByLabelText('What it’s called')).toHaveValue('Victorian Lazy Susan'));
    expect(screen.getByLabelText('What it’s made of')).toHaveValue('18" Round\nDecoupage print');
    expect(screen.getByLabelText('Price, if you have one')).toHaveValue('130');
    fireEvent.click(screen.getByRole('button', { name: 'Write it' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Save to Victorian Lazy Susan' }));
    expect(screen.queryByRole('link', { name: 'Save as a product' })).toBeNull();
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith('/manage/products/l1'));
    expect(saveDescriptionsToProduct).toHaveBeenCalledWith('l1', { short: 'S', description: 'D' });
  });

  it('goes back to a new piece, and says why a load or a save failed', async () => {
    loadPieceForDescribe.mockResolvedValueOnce({ ok: false, error: 'That product isn’t on your site any more. Reload the page.' });
    render(<DescribeTool canSaveProduct products={products} />);
    const pick = screen.getByLabelText('Start from one of your products');
    fireEvent.change(pick, { target: { value: 'l1' } });
    expect(await screen.findByRole('alert')).toHaveTextContent('isn’t on your site');
    loadPieceForDescribe.mockRejectedValueOnce(new Error('offline'));
    fireEvent.change(pick, { target: { value: '' } });
    fireEvent.change(pick, { target: { value: 'l1' } });
    expect(await screen.findByText(/Check your connection/)).toBeInTheDocument();
    fireEvent.change(pick, { target: { value: '' } });
    expect(screen.getByLabelText('What it’s called')).toHaveValue('');
    cleanup();
    loadPieceForDescribe.mockResolvedValue({ ok: true, piece: { id: 'l1', name: 'Susan', price: '', materials: [], photo: { uploadId: 'p1', url: 'https://img/p.jpg' } } });
    describePiece.mockResolvedValue({ ok: true, text: { short: 'S', description: 'D' }, left: 5 });
    saveDescriptionsToProduct.mockResolvedValueOnce({ ok: false, error: 'The descriptions couldn’t be saved. Try again in a moment.' });
    render(<DescribeTool canSaveProduct products={products} />);
    fireEvent.change(screen.getByLabelText('Start from one of your products'), { target: { value: 'l1' } });
    await vi.waitFor(() => expect(screen.getByLabelText('What it’s called')).toHaveValue('Susan'));
    fireEvent.click(screen.getByRole('button', { name: 'Write it' }));
    await vi.waitFor(() => expect(describePiece).toHaveBeenCalledWith(expect.objectContaining({ photoUploadId: 'p1' })));
    fireEvent.click(await screen.findByRole('button', { name: 'Save to Victorian Lazy Susan' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('couldn’t be saved');
    saveDescriptionsToProduct.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Save to Victorian Lazy Susan' }));
    expect(await screen.findByText(/Check your connection/)).toBeInTheDocument();
  });

  it('offers no choice when she has no products', () => {
    render(<DescribeTool canSaveProduct />);
    expect(screen.queryByLabelText('Start from one of your products')).toBeNull();
  });
});
