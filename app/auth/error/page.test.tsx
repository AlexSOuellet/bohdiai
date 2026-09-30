import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../manage/fonts', () => ({ plex: { variable: 'plex' } }));
vi.mock('../../manage/backend.css', () => ({}));

import AuthErrorPage from './page';

const run = (reason?: string | string[]) => AuthErrorPage({ searchParams: Promise.resolve(reason === undefined ? {} : { reason }) });

describe('/auth/error', () => {
  it('explains an expired link', async () => {
    render(await run('link'));
    expect(screen.getByText(/expired or was already used/)).toBeInTheDocument();
  });
  it('explains a missing site', async () => {
    render(await run('nosite'));
    expect(screen.getByText(/isn’t linked to a site/)).toBeInTheDocument();
  });
  it('falls back for unknown reasons, including prototype keys', async () => {
    render(await run('constructor'));
    expect(screen.getByText(/may have expired/)).toBeInTheDocument();
  });
  it('links back to sign-in and uses the backend look without inline styles', async () => {
    const { container } = render(await run());
    expect(screen.getByRole('link', { name: 'Back to sign in' })).toHaveAttribute('href', '/signin');
    expect(container.querySelector('.bk .bk-auth .bk-card')).not.toBeNull();
    expect(container.querySelector('[style]')).toBeNull();
  });
});
