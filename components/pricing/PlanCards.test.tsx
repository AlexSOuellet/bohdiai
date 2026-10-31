import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlanCards } from './PlanCards';

describe('PlanCards', () => {
  it('shows all of the audience’s plans, monthly by default; makers pay from sign-up, so no “built free”', () => {
    render(<PlanCards audience="maker" />);
    const showcase = screen.getByRole('article', { name: 'Maker Showcase' });
    const lite = screen.getByRole('article', { name: 'Maker Market' });
    const full = screen.getByRole('article', { name: 'Maker Full' });
    expect(showcase).toHaveTextContent('$5');
    expect(showcase).not.toHaveTextContent(/everything in/i);
    expect(lite).toHaveTextContent('$15');
    expect(lite).toHaveTextContent(/a month/);
    expect(full).toHaveTextContent('$25');
    expect(screen.queryByText(/built free/i)).toBeNull();
    expect(full).toHaveTextContent(/everything in maker market, plus/i);
    expect(screen.queryByText(/contractor/i)).toBeNull();
  });

  it('starts Free from its own card, through the same sign-up', () => {
    render(<PlanCards audience="maker" />);
    const free = screen.getByRole('article', { name: 'Maker Free' });
    expect(within(free).getByRole('link', { name: /start free/i })).toHaveAttribute('href', '/start?plan=maker-free');
  });

  it('lights up only the badged plan, with its badge beside the name', () => {
    render(<PlanCards audience="maker" />);
    const showcase = screen.getByRole('article', { name: 'Maker Showcase' });
    const full = screen.getByRole('article', { name: 'Maker Full' });
    expect(within(showcase).getByText('Most popular')).toBeTruthy();
    expect(showcase.className).toContain('border-honey-warm/40');
    expect(full.className).not.toContain('border-honey-warm/40');
    expect(within(full).queryByText('Most popular')).toBeNull();
  });

  it('switches both cards to the yearly price', async () => {
    render(<PlanCards audience="contractor" />);
    await userEvent.setup().click(screen.getByRole('radio', { name: /yearly/i }));
    expect(screen.getByRole('article', { name: 'Contractor Lead Generation' })).toHaveTextContent('$100');
    expect(screen.getByRole('article', { name: 'Contractor Full' })).toHaveTextContent('$300');
    expect(screen.getByRole('article', { name: 'Contractor Full' })).toHaveTextContent(/a year/);
    expect(screen.getByRole('radio', { name: /yearly/i })).toBeChecked();
  });

  it('sends a maker plan to the intake form with the plan and how they pay', async () => {
    render(<PlanCards audience="maker" />);
    const full = screen.getByRole('article', { name: 'Maker Full' });
    expect(within(full).getByRole('link', { name: /start your site/i })).toHaveAttribute('href', '/start?plan=maker-full&billing=monthly');
    await userEvent.setup().click(screen.getByRole('radio', { name: /yearly/i }));
    expect(within(full).getByRole('link', { name: /start your site/i })).toHaveAttribute('href', '/start?plan=maker-full&billing=yearly');
  });

  it('sends Talk to us on a contractor plan to the contact form with the plan', () => {
    render(<PlanCards audience="contractor" />);
    const full = screen.getByRole('article', { name: 'Contractor Full' });
    expect(within(full).getByRole('link', { name: /talk to us/i })).toHaveAttribute('href', '/?plan=contractor-full#contact');
  });

  it('marks contractor plans built free: service sites are made by hand and billed once live', () => {
    render(<PlanCards audience="contractor" />);
    expect(screen.getAllByText(/built free/i)).toHaveLength(2);
  });
});
