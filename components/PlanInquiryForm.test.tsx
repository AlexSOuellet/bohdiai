import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

let query = '';
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(query) }));
const { PlanInquiryForm, planFromParam } = await import('./PlanInquiryForm');

describe('planFromParam', () => {
  it('keeps a plan only when it belongs to this page', () => {
    expect(planFromParam('maker-full', 'maker')).toBe('maker-full');
    expect(planFromParam('contractor-full', 'maker')).toBeUndefined();
    expect(planFromParam('nope', 'maker')).toBeUndefined();
    expect(planFromParam(null, 'contractor')).toBeUndefined();
  });
});

describe('PlanInquiryForm', () => {
  it('starts on the plan in the address and the audience’s kind of business', () => {
    query = 'plan=contractor-lite';
    render(<PlanInquiryForm audience="contractor" />);
    expect(screen.getByLabelText('Contractor Lite')).toBeChecked();
    expect(screen.getByLabelText(/service business/i)).toBeChecked();
  });

  it('starts on "Not sure yet" with no plan in the address', () => {
    query = '';
    render(<PlanInquiryForm audience="maker" />);
    expect(screen.getByLabelText('Not sure yet')).toBeChecked();
    expect(screen.getByLabelText(/^maker$/i)).toBeChecked();
  });
});
