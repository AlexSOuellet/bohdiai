import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmButton } from './ConfirmButton';

describe('ConfirmButton', () => {
  it('asks once more before acting, in the page', () => {
    const onConfirm = vi.fn();
    render(<ConfirmButton label="Archive" confirmLabel="Yes, archive it" onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Yes, archive it' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
  it('can be backed out of', () => {
    const onConfirm = vi.fn();
    render(<ConfirmButton label="Archive" confirmLabel="Yes, archive it" onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    fireEvent.click(screen.getByRole('button', { name: 'Keep it' }));
    expect(screen.getByRole('button', { name: 'Archive' })).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });
  it('focuses the confirm button when it asks, and returns focus after backing out', () => {
    render(<ConfirmButton label="Archive" confirmLabel="Yes, archive it" onConfirm={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    expect(screen.getByRole('button', { name: 'Yes, archive it' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Keep it' }));
    expect(screen.getByRole('button', { name: 'Archive' })).toHaveFocus();
  });
  it('turns both answers off while the page is busy', () => {
    const onConfirm = vi.fn();
    const { rerender } = render(<ConfirmButton label="Archive" confirmLabel="Yes, archive it" onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    rerender(<ConfirmButton label="Archive" confirmLabel="Yes, archive it" onConfirm={onConfirm} disabled />);
    expect(screen.getByRole('button', { name: 'Yes, archive it' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Keep it' })).toBeDisabled();
  });
});
