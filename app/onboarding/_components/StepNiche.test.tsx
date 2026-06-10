import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, screen, fireEvent } from '@testing-library/react';
import StepNiche, { nicheStepCanContinue } from './StepNiche';
import { INITIAL_DATA } from './types';

// StepNiche imports the subdomain-availability server action; stub it so the
// component renders without a network call.
vi.mock('../actions', () => ({ checkSubdomainAvailable: vi.fn().mockResolvedValue({ subdomain: '', available: false }) }));

afterEach(cleanup);

describe('nicheStepCanContinue', () => {
  const ready = { selectedSlug: 'candles', nicheDescription: '', shopName: 'Flame Co', status: 'available' as const };

  it('allows a list pick with a shop name and an available subdomain', () => {
    expect(nicheStepCanContinue(ready)).toBe(true);
  });

  it('blocks "Other" until a description is typed', () => {
    const other = { ...ready, selectedSlug: 'other', nicheDescription: '' };
    expect(nicheStepCanContinue(other)).toBe(false);
    expect(nicheStepCanContinue({ ...other, nicheDescription: 'concrete planters' })).toBe(true);
  });

  it('blocks until the subdomain is available', () => {
    expect(nicheStepCanContinue({ ...ready, status: 'taken' })).toBe(false);
  });
});

describe('StepNiche — Other reveals a description box', () => {
  const props = { data: INITIAL_DATA, niches: [], onAdvance: vi.fn(), onBack: vi.fn() };

  it('shows the "Tell us what you make" textarea only after Other is selected', () => {
    render(<StepNiche {...props} />);
    expect(screen.queryByLabelText('Tell us what you make')).toBeNull();

    fireEvent.click(screen.getByText('Select your niche…'));
    fireEvent.click(screen.getByText('Other — something else'));

    expect(screen.getByLabelText('Tell us what you make')).toBeTruthy();
  });
});
