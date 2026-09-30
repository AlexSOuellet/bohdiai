import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatTile } from './StatTile';

describe('StatTile', () => {
  it('shows label, value and note', () => {
    render(<StatTile label="Products" value="12" note="3 in draft" />);
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('3 in draft')).toBeInTheDocument();
  });
  it('omits the note when there is none', () => {
    const { container } = render(<StatTile label="Products" value="12" />);
    expect(container.querySelector('.bk-tile-note')).toBeNull();
  });
});
