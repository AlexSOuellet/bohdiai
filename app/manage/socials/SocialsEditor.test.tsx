import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const { saveSocials } = vi.hoisted(() => ({ saveSocials: vi.fn() }));
vi.mock('@/lib/backend/profile/actions', () => ({ saveSocials }));
vi.mock('next/navigation', () => ({ unstable_rethrow: () => undefined }));

import { SocialsEditor } from './SocialsEditor';

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout
  saveSocials.mockReset().mockResolvedValue({ ok: true });
});
afterEach(cleanup);

describe('SocialsEditor', () => {
  it('saves the accounts', async () => {
    render(<SocialsEditor initial={{ facebookUrl: '', instagramUrl: '' }} siteUrl="https://x.bohdiai.com" />);
    fireEvent.change(screen.getByLabelText('Instagram'), { target: { value: '@june' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(saveSocials).toHaveBeenCalledWith({ facebookUrl: '', instagramUrl: '@june' }));
  });
  it('stops a link to another site before saving', async () => {
    render(<SocialsEditor initial={{ facebookUrl: '', instagramUrl: '' }} siteUrl="https://x.bohdiai.com" />);
    fireEvent.change(screen.getByLabelText('Facebook page'), { target: { value: 'https://evil.com/x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('The Facebook link should be'));
    expect(saveSocials).not.toHaveBeenCalled();
  });
});
