import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

vi.mock('../actions', () => ({
  stageLook: vi.fn(),
  publishStore: vi.fn(),
  resetStore: vi.fn(),
  editContent: vi.fn(),
  setFieldValues: vi.fn(),
  keepSection: vi.fn(),
  toggleSection: vi.fn(),
}));

import Editor from './Editor';
import type { MoodKey } from '@/lib/moods';

const baseProps = {
  currentSkin: 'main-street-ember',
  currentFeeling: 'cozy' as MoodKey,
  previewToken: 'tok',
  previewOrigin: 'https://ember.example.com',
  defaultTextureOpacity: 0.5,
};

beforeEach(() => cleanup());

describe('Editor', () => {
  it('opens on the look editor — the walk no longer lives here (D69, one-time walk)', () => {
    render(<Editor {...baseProps} />);
    expect(screen.getByText('Try a different feeling')).toBeInTheDocument();
    // the walk is a separate full-screen room now — no re-entry, no walk steps here
    expect(screen.queryByText(/Walk me through my store again/)).not.toBeInTheDocument();
    expect(screen.queryByText('Your welcome')).not.toBeInTheDocument();
  });
});
