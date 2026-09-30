import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const redirect = vi.fn((to: string): never => {
  throw new Error(`REDIRECT ${to}`);
});
vi.mock('next/navigation', () => ({ redirect: (to: string) => redirect(to) }));
vi.mock('../../manage/fonts', () => ({ plex: { variable: 'plex' } }));
vi.mock('../../manage/backend.css', () => ({}));

import ContinuePage from './page';

const ERROR = 'REDIRECT /auth/error?reason=link';
const run = (params: Record<string, string | string[]>) => ContinuePage({ searchParams: Promise.resolve(params) });

describe('/auth/continue', () => {
  it('shows a Continue form that posts the token to /auth/confirm', async () => {
    const { container } = render(await run({ token_hash: 't', type: 'invite' }));
    const form = container.querySelector('form');
    expect(form).toHaveAttribute('method', 'post');
    expect(form).toHaveAttribute('action', '/auth/confirm');
    expect(container.querySelector('input[name="token_hash"]')).toHaveValue('t');
    expect(container.querySelector('input[name="type"]')).toHaveValue('invite');
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    expect(container.querySelector('.bk')).not.toBeNull();
  });
  it('accepts a recovery link', async () => {
    render(await run({ token_hash: 't', type: 'recovery' }));
    expect(screen.getByRole('heading')).toHaveTextContent('Reset your password');
  });
  it.each([{}, { type: 'invite' }, { token_hash: 't' }, { token_hash: '', type: 'invite' }, { token_hash: 't', type: 'signup' }, { token_hash: ['a', 'b'], type: 'invite' }])(
    'sends %j to the error page',
    async (params) => {
      await expect(run(params)).rejects.toThrow(ERROR);
    },
  );
});

describe('/auth/continue privacy', () => {
  it('asks browsers not to send a Referer (the URL carries a one-time token)', async () => {
    const { metadata } = await import('./page');
    expect(metadata.referrer).toBe('no-referrer');
  });
});
