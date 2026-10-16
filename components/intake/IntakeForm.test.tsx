import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { keyWords } from '@/lib/site-words/words';
import { INTAKE_WORD_SPOTS } from '@/lib/intake/words';
import { FIELD, MAX_PIECES, MIN_PIECES } from '@/lib/intake/request';
import { FAMILY_KEYS } from '@/lib/archetypes/main-street/families';

const shrink = vi.fn((f: File) => Promise.resolve(new File([new Uint8Array(2)], f.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })));
vi.mock('@/lib/intake/browser-photo', () => ({ shrinkInBrowser: (f: File) => shrink(f) }));

import { IntakeForm } from './IntakeForm';

const words = keyWords(INTAKE_WORD_SPOTS, 'intake');
const looks = FAMILY_KEYS.map((key) => ({ key, texture: `/t/${key}.png` }));
const fetchMock = vi.fn();
const photos = (n: number): File[] => Array.from({ length: n }, (_, i) => new File([new Uint8Array(4)], `p${i}.png`, { type: 'image/png' }));

beforeEach(() => {
  fetchMock.mockReset();
  shrink.mockClear();
  vi.stubGlobal('fetch', fetchMock);
  let n = 0;
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => `blob:${(n += 1)}`), revokeObjectURL: vi.fn() }));
});
afterEach(() => vi.unstubAllGlobals());

function setup() {
  const u = userEvent.setup({ delay: null });
  const view = render(<IntakeForm words={words} looks={looks} contactEmail="alex@example.com" />);
  return { u, view };
}

async function fillAll(u: ReturnType<typeof userEvent.setup>, count = MIN_PIECES): Promise<void> {
  await u.type(screen.getByLabelText('intake.you.name'), 'Lena');
  await u.type(screen.getByLabelText('intake.you.business'), 'Saltmarsh');
  await u.type(screen.getByLabelText('intake.you.email'), 'lena@example.com');
  await u.type(screen.getByRole('textbox', { name: 'intake.makes.heading' }), 'Lace');
  await u.upload(screen.getByLabelText(/intake.pieces.add/), photos(count));
  const names = await screen.findAllByLabelText('intake.pieces.name');
  for (const [i, input] of names.entries()) await u.type(input, `Piece ${i + 1}`);
  await u.type(screen.getAllByLabelText('intake.pieces.price')[0]!, '25');
  await u.type(screen.getByRole('textbox', { name: 'intake.about.heading' }), 'I started on the porch.');
  await u.click(screen.getByRole('radio', { name: /intake\.families\.rustic\.label/ }));
}

describe('IntakeForm', { timeout: 20_000 }, () => {
  it('shows every word from the form’s own words, and a tile for every family on its own background', () => {
    setup();
    expect(screen.getByRole('heading', { name: 'intake.you.heading' })).toBeInTheDocument();
    expect(screen.getByText('intake.pieces.needed')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(FAMILY_KEYS.length + 1);
    for (const key of FAMILY_KEYS) expect(screen.getByRole('radio', { name: new RegExp(`intake\\.families\\.${key}\\.label`) })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'intake.send.button' })).toBeInTheDocument();
    expect(document.querySelector('img[src="/t/luxury.png"]')).not.toBeNull();
  });

  it('sends everything as one form and shows the thank-you', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const { u } = setup();
    await fillAll(u);
    await u.upload(screen.getByLabelText('intake.portrait.add'), photos(1));
    await screen.findByAltText('intake.portrait.alt');
    await u.click(screen.getByRole('button', { name: 'intake.send.button' }));
    expect(await screen.findByRole('status')).toHaveTextContent('intake.sent.title');
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/intake');
    const sent = init.body as FormData;
    expect(sent.get(FIELD.name)).toBe('Lena');
    expect(sent.get(FIELD.family)).toBe('rustic');
    expect(sent.getAll(FIELD.pieceName)).toEqual(['Piece 1', 'Piece 2', 'Piece 3', 'Piece 4', 'Piece 5']);
    expect(sent.getAll(FIELD.piecePrice)).toEqual(['25', '', '', '', '']);
    expect(sent.getAll(FIELD.piecePhoto)).toHaveLength(MIN_PIECES);
    expect((sent.get(FIELD.portrait) as File).type).toBe('image/jpeg');
    expect(shrink).toHaveBeenCalledTimes(MIN_PIECES + 1);
  });

  it('checks before sending, in the form’s own words', async () => {
    const { u } = setup();
    await u.click(screen.getByRole('button', { name: 'intake.send.button' }));
    expect(screen.getByRole('alert')).toHaveTextContent('intake.errors.name');
    await u.type(screen.getByLabelText('intake.you.name'), 'L');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('takes 10 pieces at most, and a piece can be removed', async () => {
    const { u } = setup();
    await u.upload(screen.getByLabelText(/intake.pieces.add/), photos(MAX_PIECES + 2));
    expect(await screen.findAllByLabelText('intake.pieces.name')).toHaveLength(MAX_PIECES);
    expect(screen.getByText('intake.pieces.full')).toBeInTheDocument();
    expect(screen.queryByLabelText(/intake.pieces.add/)).toBeNull();
    expect(screen.getByText('intake.pieces.enough')).toBeInTheDocument();
    // keyWords has no blanks, so every remove button shares the spot's name.
    await u.click(screen.getAllByRole('button', { name: 'intake.pieces.remove' })[0]!);
    await u.click(screen.getAllByRole('button', { name: 'intake.pieces.remove' })[0]!);
    expect(screen.getAllByLabelText('intake.pieces.name')).toHaveLength(MAX_PIECES - 2);
    expect(screen.getByLabelText(/intake.pieces.add/)).toBeInTheDocument();
  });

  it('says so when a photo can’t be read', async () => {
    shrink.mockRejectedValueOnce(new Error('heic'));
    const { u } = setup();
    await u.upload(screen.getByLabelText(/intake.pieces.add/), photos(2));
    expect(await screen.findByRole('alert')).toHaveTextContent('intake.errors.photoUnread');
    expect(screen.getAllByLabelText('intake.pieces.name')).toHaveLength(1);
    shrink.mockRejectedValueOnce(new Error('heic'));
    await u.upload(screen.getByLabelText('intake.portrait.add'), photos(1));
    expect(await screen.findByRole('alert')).toHaveTextContent('intake.errors.photoUnread');
  });

  it('their photo can be changed and removed', async () => {
    const { u } = setup();
    await u.upload(screen.getByLabelText('intake.portrait.add'), photos(1));
    await u.upload(await screen.findByLabelText('intake.portrait.change'), photos(1));
    await u.click(screen.getByRole('button', { name: 'intake.portrait.remove' }));
    expect(screen.queryByAltText('intake.portrait.alt')).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it('shows the route’s problem in the form’s words, the limiter’s message, or "didn’t send"', async () => {
    const { u } = setup();
    await fillAll(u);
    const send = screen.getByRole('button', { name: 'intake.send.button' });
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ problem: { spot: 'photoUnread', values: {} } }), { status: 400 }));
    await u.click(send);
    expect(await screen.findByRole('alert')).toHaveTextContent('intake.errors.photoUnread');
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Please wait a minute.' }), { status: 429 }));
    await u.click(send);
    expect(await screen.findByRole('alert')).toHaveTextContent('Please wait a minute.');
    fetchMock.mockResolvedValueOnce(new Response('not json', { status: 500 }));
    await u.click(send);
    expect(await screen.findByRole('alert')).toHaveTextContent('intake.errors.failed');
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await u.click(send);
    expect(await screen.findByRole('alert')).toHaveTextContent('intake.errors.failed');
  });

  it('"you pick for me" is a choice', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const { u } = setup();
    await fillAll(u);
    await u.click(screen.getByRole('radio', { name: /intake\.mood\.pick\.label/ }));
    await u.click(screen.getByRole('button', { name: 'intake.send.button' }));
    await screen.findByRole('status');
    expect(((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as FormData).get(FIELD.family)).toBe('pick');
    expect(within(screen.getByRole('status')).getByText('intake.sent.body')).toBeInTheDocument();
  });
});
