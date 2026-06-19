import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react';

const signInMock = vi.fn();
vi.mock('@/lib/auth/actions', () => ({
  signInMaker: (args: unknown) => signInMock(args),
}));

const pushMock = vi.fn();
let nextParam = '/';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => ({ get: () => nextParam }),
}));

// Stub the Google button so this test stays focused on the password form.
vi.mock('@/components/auth/GoogleButton', () => ({
  default: () => null,
}));

import SignInForm from './SignInForm';

function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
}

beforeEach(() => {
  cleanup();
  signInMock.mockReset();
  pushMock.mockReset();
  nextParam = '/';
});

describe('SignInForm', () => {
  it('signs in and navigates to the next path on success', async () => {
    nextParam = '/dashboard';
    signInMock.mockResolvedValue({ ok: true });

    render(<SignInForm />);
    fillAndSubmit('maker@example.com', 'sup3rsecret');

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith({ email: 'maker@example.com', password: 'sup3rsecret' });
      expect(pushMock).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows the error and does not navigate when sign-in fails', async () => {
    signInMock.mockResolvedValue({ ok: false, error: 'Invalid login credentials' });

    render(<SignInForm />);
    fillAndSubmit('maker@example.com', 'wrongpass123');

    expect(await screen.findByText('Invalid login credentials')).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
