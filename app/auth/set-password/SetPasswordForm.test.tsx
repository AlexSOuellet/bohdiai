import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const setPassword = vi.fn();
vi.mock('@/lib/backend/auth-actions', () => ({ setPassword: (args: unknown) => setPassword(args) }));

import SetPasswordForm from './SetPasswordForm';

describe('SetPasswordForm', () => {
  it('sends both fields and shows a returned error', async () => {
    setPassword.mockResolvedValue({ ok: false, error: 'The two passwords don’t match.' });
    render(<SetPasswordForm />);
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'aaaaaaaaaa' } });
    fireEvent.change(screen.getByLabelText('Type it again'), { target: { value: 'bbbbbbbbbb' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save password' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('don’t match'));
    expect(setPassword).toHaveBeenCalledWith({ password: 'aaaaaaaaaa', confirm: 'bbbbbbbbbb' });
  });
  it('shows a message when the action throws', async () => {
    setPassword.mockRejectedValue(new Error('network'));
    render(<SetPasswordForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Save password' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong. Please try again.'));
  });
});
