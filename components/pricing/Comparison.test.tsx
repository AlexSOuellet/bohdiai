import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Comparison } from './Comparison';
import { COMPARISON } from '@/lib/site/plans';

describe('Comparison', () => {
  it('shows every option with what it costs and what it means for you', () => {
    render(<Comparison audience="contractor" />);
    for (const row of COMPARISON.contractor) {
      expect(screen.getByText(row.name)).toBeInTheDocument();
      expect(screen.getByText(row.cost)).toBeInTheDocument();
      expect(screen.getByText(row.you)).toBeInTheDocument();
    }
  });

  it('marks BohdiAI as ours and says when prices were checked', () => {
    render(<Comparison audience="maker" />);
    expect(screen.getByRole('listitem', { current: true })).toHaveTextContent('BohdiAI');
    expect(screen.getByText(/prices checked october 2, 2026/i)).toBeInTheDocument();
  });
});
