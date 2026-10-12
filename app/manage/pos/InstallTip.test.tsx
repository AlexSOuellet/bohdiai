import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { InstallTip } from './InstallTip';

const standalone = (on: boolean) => vi.stubGlobal('matchMedia', (q: string) => ({ matches: on && q.includes('standalone'), addEventListener: vi.fn(), removeEventListener: vi.fn() }));

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe('InstallTip', () => {
  it('says how to put Market POS on the home screen, and stays away after Got it', () => {
    standalone(false);
    render(<InstallTip />);
    expect(screen.getByText(/Add to Home Screen/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
    expect(screen.queryByText(/Add to Home Screen/)).toBeNull();
    cleanup();
    render(<InstallTip />);
    expect(screen.queryByText(/Add to Home Screen/)).toBeNull();
  });
  it('is not shown once it was opened from the home screen', () => {
    standalone(true);
    render(<InstallTip />);
    expect(screen.queryByRole('complementary')).toBeNull();
  });
});
