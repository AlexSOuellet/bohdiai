import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const requestPasswordReset = vi.fn();
vi.mock('@/lib/backend/auth-actions', () => ({ requestPasswordReset: (args: unknown) => requestPasswordReset(args) }));

import ForgotForm from './ForgotForm';

describe('ForgotForm', () => {
  it('shows the same confirmation whatever the email', async () => {
    requestPasswordReset.mockResolvedValue({ ok: true, message: 'If that email belongs to a site owner, a reset link is on its way. Check your inbox.' });
    render(<ForgotForm />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.co' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('reset link is on its way'));
  });
  it('shows an error when sending fails', async () => {
    requestPasswordReset.mockResolvedValue({ ok: false, error: 'The reset email didn’t send. Please try again in a few minutes.' });
    render(<ForgotForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('didn’t send'));
  });
  it('shows a message when the action throws', async () => {
    requestPasswordReset.mockRejectedValue(new Error('network'));
    render(<ForgotForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong. Please try again.'));
  });
});
