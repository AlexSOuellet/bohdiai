import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const { saveContact } = vi.hoisted(() => ({ saveContact: vi.fn() }));
vi.mock('@/lib/backend/profile/actions', () => ({ saveContact }));
vi.mock('next/navigation', () => ({ unstable_rethrow: () => undefined }));

import { ContactEditor } from './ContactEditor';

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout
  saveContact.mockReset().mockResolvedValue({ ok: true });
});
afterEach(cleanup);

describe('ContactEditor', () => {
  it('saves the phone and the email for messages', async () => {
    render(<ContactEditor initial={{ phone: '', email: 'old@example.com' }} siteUrl="https://x.bohdiai.com" />);
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '(401) 555-0100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(saveContact).toHaveBeenCalledWith({ phone: '(401) 555-0100', email: 'old@example.com' }));
  });
  it('stops a bad phone number before saving', async () => {
    render(<ContactEditor initial={{ phone: '', email: '' }} siteUrl="https://x.bohdiai.com" />);
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: 'call me' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('That phone number doesn’t look right'));
    expect(saveContact).not.toHaveBeenCalled();
  });
});
