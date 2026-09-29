import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientQuote, ClientQuotes } from './ClientQuote';

const t = {
  paragraphs: ['First part and the best line here.', 'Second part that stays tucked away.'],
  highlight: 'the best line',
  name: 'Pat Doe',
  role: 'Pat’s Candles',
};

describe('ClientQuote', () => {
  it('shows only the first paragraph, with its highlight, until asked', () => {
    render(<ClientQuote t={t} />);
    expect(screen.getByText('the best line').tagName).toBe('MARK');
    expect(screen.getByText('Second part that stays tucked away.')).not.toBeVisible();
    expect(screen.getByRole('button', { name: /read more/i })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('opens and closes the rest', async () => {
    render(<ClientQuote t={t} />);
    const u = userEvent.setup();
    await u.click(screen.getByRole('button', { name: /read more/i }));
    expect(screen.getByText('Second part that stays tucked away.')).toBeVisible();
    await u.click(screen.getByRole('button', { name: /show less/i }));
    expect(screen.getByText('Second part that stays tucked away.')).not.toBeVisible();
  });

  it('has no read-more button for a one-paragraph quote', () => {
    render(<ClientQuote t={{ ...t, paragraphs: ['Just this and the best line.'] }} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Pat Doe')).toBeInTheDocument();
  });

  it('gives each quote its own read-more', () => {
    render(<ClientQuotes quotes={[t, { ...t, name: 'Sam Roe' }]} />);
    expect(screen.getAllByRole('button', { name: /read more/i })).toHaveLength(2);
    expect(screen.getByText('Sam Roe')).toBeInTheDocument();
  });
});
