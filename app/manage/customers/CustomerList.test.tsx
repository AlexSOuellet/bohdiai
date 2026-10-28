import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { CustomerList } from './CustomerList';

afterEach(cleanup);

describe('CustomerList', () => {
  it('says no one has an account yet', () => {
    render(<CustomerList customers={[]} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Customers');
    expect(screen.getByText(/No one has made an account yet/)).toBeTruthy();
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('lists her customers', () => {
    render(<CustomerList customers={[{ id: 'p1', name: 'Ada', email: 'ada@example.com', joined: '2026-10-01T12:00:00Z', orders: 2, spent: '$30' }]} />);
    expect(screen.getByRole('link', { name: 'ada@example.com' }).getAttribute('href')).toBe('mailto:ada@example.com');
    expect(screen.getByText('$30')).toBeTruthy();
  });
});
