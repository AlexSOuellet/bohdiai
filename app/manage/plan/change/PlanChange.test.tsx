import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { planOf } from '@/lib/backend/plan/plan';
import { hiddenByMove } from '@/lib/backend/plan/plan-features';

const push = vi.fn();
const changePlan = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }), unstable_rethrow: () => undefined }));
vi.mock('@/lib/backend/plan/actions', () => ({ changePlan }));
Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout

const { PlanChange } = await import('./PlanChange');

afterEach(() => {
  cleanup();
  push.mockReset();
  changePlan.mockReset();
});

describe('checkout (moving up)', () => {
  it('shows the plan, monthly or yearly, what she gets and today’s total', () => {
    render(<PlanChange from={planOf('showcase')} to={planOf('lite')} move="up" hidden={[]} />);
    expect(screen.getByRole('heading', { name: 'Maker Lite' })).toBeTruthy();
    expect(screen.getByText(planOf('lite').includes[0]!)).toBeTruthy();
    const total = () => screen.getByText(/Today:/).textContent;
    expect(total()).toContain('$15');
    fireEvent.click(screen.getByRole('radio', { name: /a year/ }));
    expect(total()).toContain('$150');
    expect(screen.getByText('Demo site: no card is charged.')).toBeTruthy();
  });

  it('switches the plan on Confirm and goes back to Your plan', async () => {
    changePlan.mockResolvedValue({ ok: true });
    render(<PlanChange from={planOf('showcase')} to={planOf('lite')} move="up" hidden={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm upgrade to Maker Lite' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/manage/plan?changed=lite'));
    expect(changePlan).toHaveBeenCalledWith('lite');
  });

  it('shows the error and stays put when the change fails, or the call throws', async () => {
    changePlan.mockResolvedValueOnce({ ok: false, error: 'You’re already on that plan.' });
    render(<PlanChange from={planOf('showcase')} to={planOf('lite')} move="up" hidden={[]} />);
    fireEvent.click(screen.getByRole('button', { name: /Confirm upgrade/ }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('You’re already on that plan.'));
    changePlan.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getByRole('button', { name: /Confirm upgrade/ }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Check your connection'));
    expect(push).not.toHaveBeenCalled();
  });
});

describe('moving down', () => {
  it('lists what gets put away, says nothing is deleted, and offers to stay', () => {
    render(<PlanChange from={planOf('full')} to={planOf('showcase')} move="down" hidden={hiddenByMove('full', 'showcase')} />);
    const list = screen.getByText('Put away until you move back up').nextElementSibling as HTMLElement;
    expect(within(list).getByText('The cart and online orders')).toBeTruthy();
    expect(screen.getByText(/Nothing is deleted/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Move down to Maker Showcase' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Stay on Maker Full' }).getAttribute('href')).toBe('/manage/plan');
    expect(screen.queryByRole('radio')).toBeNull();
  });
});
