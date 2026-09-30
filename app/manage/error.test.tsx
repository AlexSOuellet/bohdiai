import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ManageError from './error';

describe('manage error boundary', () => {
  it('explains the problem and retries on click', () => {
    const retry = vi.fn();
    render(<ManageError error={new Error('boom')} retry={retry} />);
    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.getByText('Your site’s backend couldn’t load. Try again, or sign out and back in.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in again' })).toHaveAttribute('href', '/signin');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
