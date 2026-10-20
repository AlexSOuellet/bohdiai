import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';

const saveTestimonial = vi.fn();
const removeTestimonial = vi.fn();
const orderTestimonials = vi.fn();
const showTestimonial = vi.fn();
vi.mock('next/navigation', () => ({ unstable_rethrow: () => undefined }));
vi.mock('@/lib/backend/testimonials/actions', () => ({ saveTestimonial, removeTestimonial, orderTestimonials, showTestimonial }));
Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout

const { TestimonialsManager } = await import('./TestimonialsManager');

const two = [
  { id: 'a', quote: 'So pretty', name: 'Maria', detail: 'Bristol', shown: false },
  { id: 'b', quote: 'Love it', name: 'Jo', detail: '', shown: false },
];

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('the Testimonials screen on Market', () => {
  it('ticks the ones to show, and stops at three', async () => {
    showTestimonial.mockResolvedValue({ ok: true });
    const four = [...two, { id: 'c', quote: 'Wow', name: 'Al', detail: '', shown: true }, { id: 'd', quote: 'Yes', name: 'Di', detail: '', shown: true }];
    render(<TestimonialsManager initial={four} picks />);
    expect(screen.getByText(/Your site shows up to 3/)).toBeTruthy();
    const boxes = screen.getAllByRole('checkbox', { name: 'Show on my site' }) as HTMLInputElement[];
    fireEvent.click(boxes[0]!);
    await waitFor(() => expect(showTestimonial).toHaveBeenCalledWith('a', true));
    await waitFor(() => expect((screen.getAllByRole('checkbox', { name: 'Show on my site' })[1] as HTMLInputElement).disabled).toBe(true));
  });
  it('has no ticks on Full', () => {
    render(<TestimonialsManager initial={two} />);
    expect(screen.queryByRole('checkbox')).toBeNull();
  });
});

describe('the Testimonials screen', () => {
  it('adds one and shows it in the list', async () => {
    saveTestimonial.mockResolvedValue({ ok: true, item: { id: 'c', quote: 'Beautiful', name: 'Pat', detail: '', shown: false } });
    render(<TestimonialsManager initial={[]} />);
    expect(screen.getByText(/No testimonials yet/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('What they said'), { target: { value: 'Beautiful' } });
    fireEvent.change(screen.getByLabelText('Who said it'), { target: { value: 'Pat' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add testimonial' }));
    await waitFor(() => expect(screen.getByText('“Beautiful”')).toBeTruthy());
    expect(saveTestimonial).toHaveBeenCalledWith({ id: null, quote: 'Beautiful', name: 'Pat', detail: '' });
  });

  it('checks the form before sending', () => {
    render(<TestimonialsManager initial={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add testimonial' }));
    expect(screen.getByRole('alert').textContent).toBe('Add what they said.');
    expect(saveTestimonial).not.toHaveBeenCalled();
  });

  it('moves one up', async () => {
    orderTestimonials.mockResolvedValue({ ok: true });
    render(<TestimonialsManager initial={two} />);
    fireEvent.click(screen.getByRole('button', { name: "Move Jo's testimonial up" }));
    await waitFor(() => expect(orderTestimonials).toHaveBeenCalledWith(['b', 'a']));
    const list = screen.getByRole('list', { name: 'Your testimonials' });
    expect(within(list).getAllByRole('listitem')[0]?.textContent).toContain('Love it');
  });

  it('edits one in place', async () => {
    saveTestimonial.mockResolvedValue({ ok: true, item: { id: 'a', quote: 'Gorgeous', name: 'Maria', detail: 'Bristol', shown: false } });
    render(<TestimonialsManager initial={two} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]!);
    fireEvent.change(screen.getAllByLabelText('What they said')[0]!, { target: { value: 'Gorgeous' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByText('“Gorgeous”')).toBeTruthy());
  });

  it('shows what went wrong', async () => {
    saveTestimonial.mockResolvedValue({ ok: false, error: 'That didn’t save. Try again in a moment.' });
    render(<TestimonialsManager initial={[]} />);
    fireEvent.change(screen.getByLabelText('What they said'), { target: { value: 'x' } });
    fireEvent.change(screen.getByLabelText('Who said it'), { target: { value: 'y' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add testimonial' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('That didn’t save. Try again in a moment.'));
  });
});
