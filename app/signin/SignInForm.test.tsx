import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const signIn = vi.fn();
vi.mock('@/lib/backend/auth-actions', () => ({ signIn: (args: unknown) => signIn(args) }));

import SignInForm from './SignInForm';

describe('SignInForm', () => {
  it('has no Google button and no sign-up link', () => {
    render(<SignInForm />);
    expect(screen.queryByText(/google/i)).toBeNull();
    expect(screen.queryByText(/sign up|create an account/i)).toBeNull();
  });
  it('shows the error the action returns', async () => {
    signIn.mockResolvedValue({ ok: false, error: 'That email and password don’t match.' });
    render(<SignInForm />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.co' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('That email and password don’t match.'));
    expect(signIn).toHaveBeenCalledWith({ email: 'a@b.co', password: 'x' });
  });
  it('shows a message when the action itself throws', async () => {
    signIn.mockRejectedValue(new Error('network'));
    render(<SignInForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong. Please try again.'));
  });
  it('links to forgot password', () => {
    render(<SignInForm />);
    expect(screen.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute('href', '/forgot-password');
  });
});
