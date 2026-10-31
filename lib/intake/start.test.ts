import { describe, it, expect } from 'vitest';
import { startingPlan, startingSignup } from './start';

describe('startingPlan', () => {
  it('reads the plan and how they pay from the pricing page’s button', () => {
    expect(startingPlan({ plan: 'maker-full', billing: 'yearly' })).toEqual({ plan: 'full', billing: 'yearly' });
    expect(startingPlan({ plan: 'maker-showcase' })).toEqual({ plan: 'showcase', billing: 'monthly' });
  });

  it('anything else is no plan yet, and monthly', () => {
    expect(startingPlan({})).toEqual({ plan: null, billing: 'monthly' });
    expect(startingPlan({ plan: 'gold', billing: 'weekly' })).toEqual({ plan: null, billing: 'monthly' });
    expect(startingPlan({ plan: ['maker-full', 'maker-lite'] })).toEqual({ plan: null, billing: 'monthly' });
    // Contractor plans aren't on the maker form.
    expect(startingPlan({ plan: 'contractor-full' })).toEqual({ plan: null, billing: 'monthly' });
  });
});

describe('startingSignup', () => {
  it('reads a maker plan, or Free (always monthly)', () => {
    expect(startingSignup({ plan: 'maker-lite', billing: 'yearly' })).toEqual({ plan: 'lite', billing: 'yearly', back: false });
    expect(startingSignup({ plan: 'maker-free', billing: 'yearly' })).toEqual({ plan: 'free', billing: 'monthly', back: false });
    expect(startingSignup({})).toEqual({ plan: null, billing: 'monthly', back: false });
  });

  it('knows when Stripe’s back button brought them here', () => {
    expect(startingSignup({ plan: 'maker-full', back: '1' })).toMatchObject({ back: true });
  });
});
