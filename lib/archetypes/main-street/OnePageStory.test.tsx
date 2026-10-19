import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OnePageStory, STORY_ID } from './OnePageStory';

describe('OnePageStory', () => {
  it('holds the whole story, as the target the about card’s "read more" opens', () => {
    const { container } = render(<OnePageStory story={['It started with seed catalogs.', 'Eight coats on every dish.']} />);
    expect(screen.getByText('Eight coats on every dish.')).toBeTruthy();
    expect(container.querySelector(`section#${STORY_ID}.ms-story`)).not.toBeNull();
  });

  it('shows nothing with no story', () => {
    const { container } = render(<OnePageStory story={[]} />);
    expect(container.innerHTML).toBe('');
  });
});
