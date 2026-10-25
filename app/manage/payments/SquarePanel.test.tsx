import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

const refresh = vi.fn();
const disconnectSquare = vi.fn();
const squareLocations = vi.fn();
const chooseSquareLocation = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }), unstable_rethrow: () => undefined }));
vi.mock('@/lib/backend/payments/square-actions', () => ({ disconnectSquare, squareLocations, chooseSquareLocation }));
Element.prototype.scrollIntoView = vi.fn(); // jsdom has no layout

const { SquarePanel } = await import('./SquarePanel');

const linked = { businessName: 'Saltmarsh & Lace', locationId: 'L1', locationName: 'Market booth', connectedAt: '2026-10-21T12:00:00Z' };

afterEach(() => {
  cleanup();
  [refresh, disconnectSquare, squareLocations, chooseSquareLocation].forEach((f) => f.mockReset());
});

describe('SquarePanel', () => {
  it('offers Connect Square when it isn’t connected', () => {
    render(<SquarePanel link={null} ready outcome={null} />);
    expect(screen.getByRole('link', { name: 'Connect Square' }).getAttribute('href')).toBe('/api/square/connect');
    expect(screen.getByText(/never sees a card or your Square password/)).toBeTruthy();
  });

  it('keeps Connect Square in place, saying plainly when Square isn’t set up on BohdiAI', () => {
    render(<SquarePanel link={null} ready={false} outcome={null} />);
    expect(screen.getByRole('link', { name: 'Connect Square' })).toBeTruthy();
    expect(screen.getByText(/Square isn’t set up on BohdiAI yet/)).toBeTruthy();
  });

  it('shows what’s connected and the typed-in fee, and disconnects after a yes', async () => {
    disconnectSquare.mockResolvedValue({ ok: true });
    render(<SquarePanel link={linked} ready outcome={null} />);
    expect(screen.getByText('Saltmarsh & Lace')).toBeTruthy();
    expect(screen.getByText('Market booth')).toBeTruthy();
    expect(screen.getByText(/higher fee for a typed-in card/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Disconnect Square' }));
    expect(disconnectSquare).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Yes, disconnect' }));
    await waitFor(() => expect(disconnectSquare).toHaveBeenCalled());
    expect(await screen.findByText(/Square has cancelled BohdiAI’s access/)).toBeTruthy();
  });

  it('asks which location when there are several, and saves the pick', async () => {
    squareLocations.mockResolvedValue({ ok: true, locations: [{ id: 'L1', name: 'Shop' }, { id: 'L2', name: 'Market booth' }] });
    chooseSquareLocation.mockResolvedValue({ ok: true });
    render(<SquarePanel link={{ ...linked, locationId: null, locationName: '' }} ready outcome={null} />);
    const select = await screen.findByLabelText('Which Square location do your market sales go to?');
    await screen.findByRole('option', { name: 'Market booth' });
    fireEvent.change(select, { target: { value: 'L2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(chooseSquareLocation).toHaveBeenCalledWith('L2'));
  });

  it('shows what happened on Square’s page', () => {
    render(<SquarePanel link={linked} ready outcome={{ tone: 'ok', text: 'Your Square is connected.' }} />);
    expect(screen.getByText('Your Square is connected.')).toBeTruthy();
  });
});
