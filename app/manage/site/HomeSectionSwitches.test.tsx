import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

const setHomeSection = vi.fn();
vi.mock('@/lib/backend/home-sections/actions', () => ({ setHomeSection: (...a: unknown[]) => setHomeSection(...a) }));

const { HomeSectionSwitches } = await import('./HomeSectionSwitches');

const rows = [
  { section: 'about' as const, label: 'About you', heading: 'Rustic and a little grungy', on: true },
  { section: 'reviews' as const, label: 'Testimonials', heading: '', on: true },
];

afterEach(() => {
  cleanup();
  setHomeSection.mockReset();
});

describe('HomeSectionSwitches', () => {
  it('shows a switch beside each section with her own heading', () => {
    render(<HomeSectionSwitches rows={rows} />);
    expect(screen.getAllByRole('switch')).toHaveLength(2);
    expect(screen.getByText('Rustic and a little grungy')).toBeTruthy();
  });

  it('turns a section off and says nothing is deleted', async () => {
    setHomeSection.mockResolvedValue({ ok: true });
    render(<HomeSectionSwitches rows={rows} />);
    const box = screen.getByRole('switch', { name: 'Testimonials' }) as HTMLInputElement;
    fireEvent.click(box);
    await waitFor(() => expect(screen.getByText('Testimonials is hidden from your home page. Nothing is deleted.')).toBeTruthy());
    expect(setHomeSection).toHaveBeenCalledWith('reviews', false);
    expect(box.checked).toBe(false);
  });

  it('shows a refusal and keeps the switch as it was', async () => {
    setHomeSection.mockResolvedValue({ ok: false, error: 'Add a photo first.' });
    render(<HomeSectionSwitches rows={rows} />);
    const box = screen.getByRole('switch', { name: /About you/ }) as HTMLInputElement;
    fireEvent.click(box);
    await waitFor(() => expect(screen.getByText('Add a photo first.')).toBeTruthy());
    expect(box.checked).toBe(true);
  });
});
