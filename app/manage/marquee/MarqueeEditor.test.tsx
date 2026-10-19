import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const { saveMarquee } = vi.hoisted(() => ({ saveMarquee: vi.fn() }));
vi.mock('@/lib/backend/profile/actions', () => ({ saveMarquee }));
vi.mock('next/navigation', () => ({ unstable_rethrow: () => undefined }));

import { MarqueeEditor, marqueeSlots } from './MarqueeEditor';

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout
  saveMarquee.mockReset().mockResolvedValue({ ok: true });
});
afterEach(cleanup);

describe('MarqueeEditor', () => {
  it('grows a new box as the last one fills, and saves the phrases in order', async () => {
    render(<MarqueeEditor initial={['Small batch']} siteUrl="https://x.bohdiai.com" />);
    fireEvent.change(screen.getByLabelText('Phrase 2'), { target: { value: 'Poured by hand' } });
    expect(screen.getByLabelText('Phrase 3')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByText('Saved. Your site shows the changes now.')).toBeTruthy());
    expect(saveMarquee).toHaveBeenCalledWith(['Small batch', 'Poured by hand']);
  });
  it('counts clearing a new phrase back out as no change', () => {
    render(<MarqueeEditor initial={['Small batch']} siteUrl="https://x.bohdiai.com" />);
    fireEvent.change(screen.getByLabelText('Phrase 2'), { target: { value: 'x' } });
    fireEvent.change(screen.getByLabelText('Phrase 2'), { target: { value: '' } });
    expect(screen.queryByText('Unsaved changes')).toBeNull();
  });
});

describe('marqueeSlots', () => {
  it('adds one empty box after the last phrase, drops trailing blanks, and stops at the limit', () => {
    expect(marqueeSlots([])).toEqual(['']);
    expect(marqueeSlots(['a', '', ''])).toEqual(['a', '']);
    expect(marqueeSlots(['a', '', 'b'])).toEqual(['a', '', 'b', '']);
    const full = Array.from({ length: 12 }, (_, i) => `p${i}`);
    expect(marqueeSlots(full)).toEqual(full);
  });
});
