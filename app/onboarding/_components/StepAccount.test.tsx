import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react';

const signUpMock = vi.fn();
vi.mock('@/lib/auth/actions', () => ({
  signUpMaker: (args: unknown) => signUpMock(args),
}));

// Stub the Google button so this test stays focused on the password form.
vi.mock('@/components/auth/GoogleButton', () => ({
  default: () => null,
}));

import StepAccount from './StepAccount';

function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: /create (my )?account/i }));
}

beforeEach(() => {
  cleanup();
  signUpMock.mockReset();
});

describe('StepAccount', () => {
  it('creates the account and advances on success', async () => {
    signUpMock.mockResolvedValue({ ok: true });
    const onAdvance = vi.fn();

    render(<StepAccount onAdvance={onAdvance} />);
    fillAndSubmit('maker@example.com', 'sup3rsecret');

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith({ email: 'maker@example.com', password: 'sup3rsecret' });
      expect(onAdvance).toHaveBeenCalledTimes(1);
    });
  });

  it('shows the error and does not advance on failure', async () => {
    signUpMock.mockResolvedValue({ ok: false, error: 'User already registered' });
    const onAdvance = vi.fn();

    render(<StepAccount onAdvance={onAdvance} />);
    fillAndSubmit('maker@example.com', 'sup3rsecret');

    expect(await screen.findByText('User already registered')).toBeInTheDocument();
    expect(onAdvance).not.toHaveBeenCalled();
  });
});
