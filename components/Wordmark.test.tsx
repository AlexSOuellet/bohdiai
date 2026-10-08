import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Wordmark, Ember } from './Wordmark';

describe('Wordmark', () => {
  it('reads as BohdiAI to screen readers, not as the dotless i', () => {
    render(<Wordmark />);
    expect(screen.getByRole('img', { name: 'BohdiAI' })).toBeTruthy();
  });

  it('gives each ember its own gradient so two on a page do not collide', () => {
    const { container } = render(
      <>
        <Ember />
        <Ember />
      </>,
    );
    const ids = [...container.querySelectorAll('linearGradient')].map((g) => g.id);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  it('burns the counter through the big ember but not the small one', () => {
    const { container } = render(
      <>
        <Ember />
        <Ember hollow={false} />
      </>,
    );
    const [hollow, solid] = [...container.querySelectorAll('path')].map((p) => p.getAttribute('d') ?? '');
    expect(hollow).toContain('A13 13');
    expect(solid).not.toContain('A13 13');
  });
});
