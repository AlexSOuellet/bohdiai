import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../manage/fonts', () => ({ plex: { variable: 'plex' } }));
vi.mock('./SignInForm', () => ({ default: () => <form aria-label="sign in form" /> }));

import SignInPage from './page';
import { SIGNED_OUT_IDLE, SIGNED_OUT_MAX } from '@/lib/backend/auth-messages';

const page = async (params: Record<string, string | string[] | undefined>) =>
  render(await SignInPage({ searchParams: Promise.resolve(params) }));

describe('SignInPage', () => {
  it('says why after an idle sign-out', async () => {
    await page({ ended: 'idle' });
    expect(screen.getByRole('status')).toHaveTextContent(SIGNED_OUT_IDLE);
  });
  it('says why after the 7-day sign-out', async () => {
    await page({ ended: 'max' });
    expect(screen.getByRole('status')).toHaveTextContent(SIGNED_OUT_MAX);
  });
  it('shows no note on a normal visit', async () => {
    await page({});
    expect(screen.queryByRole('status')).toBeNull();
  });
  it('ignores an unknown reason', async () => {
    await page({ ended: '<script>' });
    expect(screen.queryByRole('status')).toBeNull();
  });
});
