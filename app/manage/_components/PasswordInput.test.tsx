import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { PasswordInput } from './PasswordInput';

afterEach(cleanup);

describe('PasswordInput', () => {
  it('shows what was typed, then hides it again', () => {
    render(
      <>
        <label htmlFor="pw">Password</label>
        <PasswordInput id="pw" value="secret-123" onChange={() => undefined} />
      </>,
    );
    const box = screen.getByLabelText('Password') as HTMLInputElement;
    expect(box.type).toBe('password');
    fireEvent.click(screen.getByRole('button', { name: 'Show' }));
    expect(box.type).toBe('text');
    expect(screen.getByRole('button', { name: 'Hide' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Hide' }));
    expect(box.type).toBe('password');
  });
});
