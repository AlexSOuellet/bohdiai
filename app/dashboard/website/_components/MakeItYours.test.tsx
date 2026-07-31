import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

const editContent = vi.fn();
const setFieldValues = vi.fn();
const keepSection = vi.fn();
const toggleSection = vi.fn();
vi.mock('../actions', () => ({
  editContent: (...a: unknown[]) => editContent(...a),
  setFieldValues: (...a: unknown[]) => setFieldValues(...a),
  keepSection: (...a: unknown[]) => keepSection(...a),
  toggleSection: (...a: unknown[]) => toggleSection(...a),
}));

import MakeItYours from './MakeItYours';

beforeEach(() => {
  [editContent, setFieldValues, keepSection, toggleSection].forEach((m) => m.mockReset());
  cleanup();
});

function renderWalk() {
  render(<MakeItYours previewToken="tok-123" previewOrigin="https://ember.test" values={{}} />);
}

describe('MakeItYours (full-screen walk)', () => {
  it('opens full-screen on step 1 with no exit — the editor is gated', () => {
    renderWalk();
    expect(screen.getByText('Make it yours')).toBeInTheDocument();
    expect(screen.getByText('Finish to reach your editor')).toBeInTheDocument();
    expect(screen.getByText(/Step 1 of/)).toBeInTheDocument();
    expect(screen.getByText('Your welcome')).toBeInTheDocument();
    expect(screen.queryByText('Close')).not.toBeInTheDocument();
  });

  it('previews the maker’s own draft', () => {
    renderWalk();
    const frame = screen.getByTitle('Your store preview') as HTMLIFrameElement;
    expect(frame.src).toContain('previewToken=tok-123');
    expect(frame.src).toContain('previewStill=1');
  });

  it('Next is gated until the section is resolved, then advances', async () => {
    keepSection.mockResolvedValue({ ok: true });
    renderWalk();
    expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Keep as built' }));
    await screen.findByText(/Kept/);
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(screen.getByText('Your story')).toBeInTheDocument();
    expect(screen.getByText(/Step 2 of/)).toBeInTheDocument();
  });
});
