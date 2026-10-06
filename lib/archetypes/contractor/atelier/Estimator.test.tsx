import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Estimator } from './Estimator';
import { EstimatorSchema } from '../schemas';

const ESTIMATOR = EstimatorSchema.parse({
  eyebrow: 'Ballpark',
  title: 'What would it cost',
  intro: 'Pick the job.',
  scopes: [
    { key: 'inside', name: 'Interior', detail: 'Walls', icon: 'weekend' },
    { key: 'outside', name: 'Exterior', detail: 'Siding' },
  ],
  sizes: [{ key: 'small', name: 'A room' }, { key: 'big', name: 'The house' }],
  grades: [
    { key: 'std', name: 'Standard', detail: 'Two coats', note: 'Base' },
    { key: 'top', name: 'Premium', detail: 'Top paint', note: '+25%' },
  ],
  ranges: {
    'inside|small|std': '$1 – $2', 'inside|small|top': '$3 – $4', 'inside|big|std': '$5 – $6', 'inside|big|top': '$7 – $8',
    'outside|small|std': '$9 – $10', 'outside|small|top': '$11 – $12', 'outside|big|std': '$13 – $14', 'outside|big|top': '$15 – $16',
  },
  rangeNote: 'Includes prep',
});

describe('atelier estimator', () => {
  it('starts on the first job, size and finish, with that range', () => {
    render(<Estimator estimator={ESTIMATOR} estimateHref="#estimate" />);
    expect(screen.getByText('$1 – $2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /interior/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('link', { name: 'Send this to us' })).toHaveAttribute('href', '#estimate');
  });

  it('shows the authored range for whatever is picked', async () => {
    const user = userEvent.setup();
    render(<Estimator estimator={ESTIMATOR} estimateHref="#estimate" />);
    await user.click(screen.getByRole('button', { name: /exterior/i }));
    expect(screen.getByText('$9 – $10')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'The house' }));
    expect(screen.getByText('$13 – $14')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /premium/i }));
    expect(screen.getByText('$15 – $16')).toBeInTheDocument();
  });

  it('refuses an estimator with an unpriced combination', () => {
    const ranges = { ...ESTIMATOR.ranges };
    delete ranges['outside|big|top'];
    expect(EstimatorSchema.safeParse({ ...ESTIMATOR, ranges }).success).toBe(false);
  });
});
