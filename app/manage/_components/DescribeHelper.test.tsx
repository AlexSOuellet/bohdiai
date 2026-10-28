import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

const describePiece = vi.hoisted(() => vi.fn());
vi.mock('@/lib/tools/describe-actions', () => ({ describePiece }));
vi.mock('next/navigation', () => ({ unstable_rethrow: () => undefined }));

import { DescribeHelper } from './DescribeHelper';

afterEach(() => {
  cleanup();
  describePiece.mockReset();
});

const open = (over: Partial<Parameters<typeof DescribeHelper>[0]> = {}) => {
  const onWritten = vi.fn();
  render(<DescribeHelper name="Lazy Susan" materials={['Pine round']} price="130" photoUploadId="p1" onWritten={onWritten} {...over} />);
  fireEvent.click(screen.getByRole('button', { name: 'Help me write it' }));
  return onWritten;
};

describe('Help me write it (Alex, 2026-10-28)', () => {
  it('says what it writes from, then fills both boxes and counts what’s left', async () => {
    describePiece.mockResolvedValue({ ok: true, text: { short: 'S', description: 'D' }, left: 29 });
    const onWritten = open();
    expect(screen.getByText(/from the name, what it’s made of, its main photo, the price/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Anything to add?'), { target: { value: '18 inches across' } });
    fireEvent.click(screen.getByRole('button', { name: 'Write it' }));
    expect(await screen.findByText('29 more this month')).toBeInTheDocument();
    expect(onWritten).toHaveBeenCalledWith({ short: 'S', description: 'D' });
    expect(describePiece).toHaveBeenCalledWith({ name: 'Lazy Susan', materials: ['Pine round'], facts: '18 inches across', price: '130', photoUploadId: 'p1' });
    expect(screen.getByRole('button', { name: 'Write it again' })).toBeInTheDocument();
  });

  it('waits for a name, and says why a run didn’t work', async () => {
    open({ name: ' ', materials: [], price: '', photoUploadId: null });
    expect(screen.getByRole('button', { name: 'Write it' })).toBeDisabled();
    expect(screen.getByText('Give it a name first.')).toBeInTheDocument();
    cleanup();
    describePiece.mockResolvedValueOnce({ ok: false, error: 'You’ve used this month’s 30 descriptions.' });
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Write it' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('You’ve used this month’s 30 descriptions.');
    describePiece.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Write it' }));
    expect(await screen.findByText(/Check your connection/)).toBeInTheDocument();
  });

  it('says one more when one is left', async () => {
    describePiece.mockResolvedValue({ ok: true, text: { short: 'S', description: 'D' }, left: 1 });
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Write it' }));
    expect(await screen.findByText('1 more this month')).toBeInTheDocument();
  });
});
