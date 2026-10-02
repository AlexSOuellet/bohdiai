import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlanCards } from './PlanCards';

describe('PlanCards', () => {
  it('shows both of the audience’s plans, monthly by default, built free', () => {
    render(<PlanCards audience="maker" path="/makers" />);
    const lite = screen.getByRole('article', { name: 'Maker Lite' });
    const full = screen.getByRole('article', { name: 'Maker Full' });
    expect(lite).toHaveTextContent('$14.99');
    expect(lite).toHaveTextContent(/a month/);
    expect(full).toHaveTextContent('$19.99');
    expect(lite).toHaveTextContent(/built free/i);
    expect(full).toHaveTextContent(/everything in lite, plus/i);
    expect(screen.queryByText(/contractor/i)).toBeNull();
  });

  it('switches both cards to the yearly price', async () => {
    render(<PlanCards audience="contractor" path="/contractors" />);
    await userEvent.setup().click(screen.getByRole('radio', { name: /yearly/i }));
    expect(screen.getByRole('article', { name: 'Contractor Lite' })).toHaveTextContent('$149');
    expect(screen.getByRole('article', { name: 'Contractor Full' })).toHaveTextContent('$299');
    expect(screen.getByRole('article', { name: 'Contractor Full' })).toHaveTextContent(/a year/);
    expect(screen.getByRole('radio', { name: /yearly/i })).toBeChecked();
  });

  it('sends Get started to the contact form with the plan', () => {
    render(<PlanCards audience="maker" path="/makers" />);
    const full = screen.getByRole('article', { name: 'Maker Full' });
    expect(within(full).getByRole('link', { name: /get started/i })).toHaveAttribute(
      'href',
      '/makers?plan=maker-full#contact',
    );
  });
});
