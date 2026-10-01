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
});
