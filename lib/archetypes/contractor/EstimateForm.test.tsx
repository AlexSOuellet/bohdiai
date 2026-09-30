import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { EstimateForm, checkEstimate, MAX_PHOTO_BYTES } from './EstimateForm';
import { CONTRACTOR_STRINGS } from './strings';

const S = CONTRACTOR_STRINGS.form;
const TENANT = '4b8f0f5e-8f3a-4a57-9a8e-1f2d3c4b5a69';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function photo(name: string, type = 'image/jpeg', size = 10): File {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
}

function renderForm() {
  render(<EstimateForm tenantId={TENANT} services={['Grading', 'Drainage']} states={['Rhode Island', 'Massachusetts']} />);
  fireEvent.change(screen.getByLabelText(S.name), { target: { value: 'Pat' } });
  fireEvent.change(screen.getByLabelText(S.email), { target: { value: 'pat@example.com' } });
}

function choosePhotos(files: File[] | null): void {
  fireEvent.change(screen.getByLabelText(new RegExp(S.photos)), { target: { files } });
}

function submit(): void {
  fireEvent.click(screen.getByRole('button', { name: S.submit }));
}

describe('checkEstimate — photo size', () => {
  it('refuses a photo over the size cap', () => {
    expect(checkEstimate({ name: 'Pat', phone: '1', email: '' }, [photo('big.jpg', 'image/jpeg', MAX_PHOTO_BYTES + 1)])).toBe(S.errorPhotoTooBig);
    expect(checkEstimate({ name: 'Pat', phone: '1', email: '' }, [photo('ok.jpg', 'image/jpeg', MAX_PHOTO_BYTES)])).toBeNull();
  });

  it('treats a whitespace-only name as missing', () => {
    expect(checkEstimate({ name: '   ', phone: '1', email: '' }, [])).toBe(S.errorName);
  });
});

describe('EstimateForm — photos', () => {
  it('shows how many photos are ready and sends each one with the request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    renderForm();
    choosePhotos([photo('a.jpg'), photo('b.png', 'image/png')]);
    expect(screen.getByText(S.photosChosen(2))).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    submit();
    await waitFor(() => expect(screen.getByText(S.successTitle)).toBeTruthy());
    const body = fetchMock.mock.calls[0]![1].body as FormData;
    expect((body.getAll('photos') as File[]).map((f) => f.name)).toEqual(['a.jpg', 'b.png']);
    expect(body.get('email')).toBe('pat@example.com');
  });

  it('flags a bad photo the moment it is chosen, and refuses to send it', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    renderForm();
    choosePhotos([photo('anim.gif', 'image/gif')]);
    expect(screen.getByRole('alert').textContent).toBe(S.errorPhotoType);
    submit();
    expect(screen.getByRole('alert').textContent).toBe(S.errorPhotoType);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('clears the photo error once a good set replaces it, and treats a cleared picker as no photos', () => {
    renderForm();
    choosePhotos([photo('huge.jpg', 'image/jpeg', MAX_PHOTO_BYTES + 1)]);
    expect(screen.getByRole('alert').textContent).toBe(S.errorPhotoTooBig);
    choosePhotos([photo('ok.jpg')]);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText(S.photosChosen(1))).toBeTruthy();
    choosePhotos(null);
    expect(screen.queryByText(S.photosChosen(1))).toBeNull();
  });
});

describe('EstimateForm — sending and the result', () => {
  it('shows a sending state with the button disabled while the request is in flight', async () => {
    let resolve: (r: Response) => void = () => {};
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((r) => { resolve = r; })));
    renderForm();
    submit();
    const btn = await screen.findByRole('button', { name: S.sending });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
    expect(btn.closest('form')!.getAttribute('aria-busy')).toBe('true');
    resolve(new Response('{}', { status: 200 }));
    await waitFor(() => expect(screen.getByText(S.successTitle)).toBeTruthy());
  });

  it('"send another" returns to an empty form', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })));
    renderForm();
    submit();
    fireEvent.click(await screen.findByRole('button', { name: S.sendAnother }));
    expect(screen.getByRole('button', { name: S.submit })).toBeTruthy();
    expect((screen.getByLabelText(S.name) as HTMLInputElement).value).toBe('');
  });

  it('falls back to the generic message when a refusal has no readable error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>gateway</html>', { status: 502 })));
    renderForm();
    submit();
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(S.errorGeneric));
  });

  it('falls back to the generic message when the error field is not a string', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 42 } }), { status: 400 })));
    renderForm();
    submit();
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(S.errorGeneric));
  });

  it('falls back to the generic message when the refusal body is JSON null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('null', { status: 400 })));
    renderForm();
    submit();
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(S.errorGeneric));
  });

  it('never sends without a name', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<EstimateForm tenantId={TENANT} services={[]} states={[]} />);
    fireEvent.change(screen.getByLabelText(S.phone), { target: { value: '401 555 0100' } });
    submit();
    expect(screen.getByRole('alert').textContent).toBe(S.errorName);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('renders each service as a checkbox and each state as an option', () => {
    renderForm();
    expect(screen.getByRole('checkbox', { name: 'Grading' })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Drainage' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Massachusetts' })).toBeTruthy();
  });
});
