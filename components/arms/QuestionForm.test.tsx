import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionForm, checkQuestion } from './QuestionForm';

afterEach(() => vi.unstubAllGlobals());

const fill = async (user: ReturnType<typeof userEvent.setup>): Promise<void> => {
  await user.type(screen.getByLabelText('Your name'), 'June');
  await user.type(screen.getByLabelText('Email'), 'june@example.com');
  await user.type(screen.getByLabelText('Your question'), 'Can I sell digital patterns?');
};

describe('QuestionForm', () => {
  it('asks only for a name, an email and the question', () => {
    expect(checkQuestion({ name: '', email: 'a@b.co', message: 'x', company: '' })).toBe('Please add your name.');
    expect(checkQuestion({ name: 'J', email: 'nope', message: 'x', company: '' })).toBe('That email doesn’t look right.');
    expect(checkQuestion({ name: 'J', email: 'a@b.co', message: ' ', company: '' })).toBe('Write your question first.');
    expect(checkQuestion({ name: 'J', email: 'a@b.co', message: 'x', company: '' })).toBeNull();
  });

  it('says what is missing without sending', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<QuestionForm />);
    await user.click(screen.getByRole('button', { name: 'Send my question' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Please add your name.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends it as a maker by email and thanks them', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<QuestionForm />);
    await fill(user);
    await user.click(screen.getByRole('button', { name: 'Send my question' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Thanks, it’s on its way');
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/inquiry');
    expect(JSON.parse(String(init.body))).toMatchObject({ name: 'June', kind: 'maker', contactBy: 'email', message: 'Can I sell digital patterns?' });
  });

  it('shows the server’s message, or the fallback with Alex’s address when sending fails', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'Too many messages.' }), { status: 429 })));
    render(<QuestionForm />);
    await fill(user);
    await user.click(screen.getByRole('button', { name: 'Send my question' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many messages.');

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await user.type(screen.getByLabelText('Your question'), '?');
    await user.click(screen.getByRole('button', { name: 'Send my question' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/email me at/);
  });
});
