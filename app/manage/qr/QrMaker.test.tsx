import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

const toString = vi.fn();
const toDataURL = vi.fn();
vi.mock('qrcode', () => ({ default: { toString: (...a: unknown[]) => toString(...a), toDataURL: (...a: unknown[]) => toDataURL(...a) } }));

const { QrMaker } = await import('./QrMaker');

const O = 'https://rose-n-cat.bohdiai.com';
const targets = [
  { key: 'home', label: 'Your home page', url: `${O}/` },
  { key: 'p:theo', label: 'Theo', url: `${O}/listings/theo` },
];

afterEach(() => {
  cleanup();
  toString.mockReset();
  toDataURL.mockReset();
});

describe('QrMaker', () => {
  it('shows the code for the home page with both downloads', async () => {
    toString.mockResolvedValue('<svg/>');
    toDataURL.mockResolvedValue('data:image/png;base64,AAA');
    render(<QrMaker targets={targets} subdomain="rose-n-cat" />);
    const img = await screen.findByRole('img', { name: `QR code that opens ${O}/` });
    expect(img.getAttribute('src')).toBe('data:image/png;base64,AAA');
    expect(screen.getByRole('link', { name: 'Download picture (PNG)' }).getAttribute('download')).toBe('rose-n-cat-qr.png');
    expect(screen.getByRole('link', { name: 'Download for printing large (SVG)' }).getAttribute('download')).toBe('rose-n-cat-qr.svg');
  });

  it('makes a new code when another page is picked', async () => {
    toString.mockResolvedValue('<svg/>');
    toDataURL.mockResolvedValue('data:image/png;base64,AAA');
    render(<QrMaker targets={targets} subdomain="rose-n-cat" />);
    fireEvent.change(screen.getByLabelText('Opens'), { target: { value: 'p:theo' } });
    await waitFor(() => expect(toDataURL).toHaveBeenLastCalledWith(`${O}/listings/theo`, expect.anything()));
    expect(await screen.findByRole('img', { name: `QR code that opens ${O}/listings/theo` })).toBeTruthy();
  });

  it('says so when the code cannot be made', async () => {
    toString.mockRejectedValue(new Error('boom'));
    toDataURL.mockRejectedValue(new Error('boom'));
    render(<QrMaker targets={targets} subdomain="rose-n-cat" />);
    expect((await screen.findByRole('alert')).textContent).toContain('couldn’t be made');
  });
});
