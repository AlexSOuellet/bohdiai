import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../actions', () => ({
  stageLook: vi.fn(),
  publishStore: vi.fn(),
  resetStore: vi.fn(),
  editContent: vi.fn(),
  setFieldValues: vi.fn(),
}));

import Editor from './Editor';
import type { MoodKey } from '@/lib/moods';

const baseProps = {
  currentSkin: 'main-street-ember',
  currentFeeling: 'cozy' as MoodKey,
  previewToken: 'tok',
  previewOrigin: 'https://ember.example.com',
  defaultTextureOpacity: 0.5,
  walkValues: {},
};

beforeEach(() => cleanup());

describe('Editor hosting the walkthrough', () => {
  it('auto-opens the walk on a first run', () => {
    render(<Editor {...baseProps} firstRun />);
    expect(screen.getByText('Your welcome')).toBeInTheDocument(); // first walk step
    expect(screen.queryByText('Try a different feeling')).not.toBeInTheDocument();
  });

  it('a returning maker lands in the look editor, with a re-trigger that opens the walk', () => {
    render(<Editor {...baseProps} firstRun={false} />);
    expect(screen.getByText('Try a different feeling')).toBeInTheDocument();
    expect(screen.queryByText('Your welcome')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(/Walk me through my store again/));
    expect(screen.getByText('Your welcome')).toBeInTheDocument();
  });
});
