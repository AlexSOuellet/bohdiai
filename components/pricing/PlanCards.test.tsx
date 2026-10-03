import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlanCards } from './PlanCards';

describe('PlanCards', () => {
  it('shows all of the audience’s plans, monthly by default, built free', () => {
    render(<PlanCards audience="maker" path="/makers" />);
    const showcase = screen.getByRole('article', { name: 'Maker Showcase' });
    const lite = screen.getByRole('article', { name: 'Maker Lite' });
    const full = screen.getByRole('article', { name: 'Maker Full' });
    expect(showcase).toHaveTextContent('$5');
    expect(showcase).not.toHaveTextContent(/everything in lite/i);
    expect(lite).toHaveTextContent('$15');
    expect(lite).toHaveTextContent(/a month/);
    expect(full).toHaveTextContent('$20');
    expect(lite).toHaveTextContent(/built free/i);
    expect(full).toHaveTextContent(/everything in lite, plus/i);
    expect(screen.queryByText(/contractor/i)).toBeNull();
  });

  it('switches both cards to the yearly price', async () => {
    render(<PlanCards audience="contractor" path="/contractors" />);
    await userEvent.setup().click(screen.getByRole('radio', { name: /yearly/i }));
    expect(screen.getByRole('article', { name: 'Contractor Lite' })).toHaveTextContent('$150');
    expect(screen.getByRole('article', { name: 'Contractor Full' })).toHaveTextContent('$300');
    expect(screen.getByRole('article', { name: 'Contractor Full' })).toHaveTextContent(/a year/);
    expect(screen.getByRole('radio', { name: /yearly/i })).toBeChecked();
  });

  it('sends Talk to us to the contact form with the plan', () => {
    render(<PlanCards audience="maker" path="/makers" />);
    const full = screen.getByRole('article', { name: 'Maker Full' });
    expect(within(full).getByRole('link', { name: /talk to us/i })).toHaveAttribute(
      'href',
      '/makers?plan=maker-full#contact',
    );
  });
});
