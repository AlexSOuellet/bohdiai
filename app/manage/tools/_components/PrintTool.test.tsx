import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react';

const m = vi.hoisted(() => ({
  open: vi.fn(),
  enlarge: vi.fn(),
  buildPdf: vi.fn(),
  drawRegion: vi.fn(),
  savePiece: vi.fn(),
  renamePiece: vi.fn(),
  deletePiece: vi.fn(),
}));
vi.mock('./print/open', () => ({ openPicture: m.open }));
vi.mock('./print/enlarge', () => ({ enlarge: m.enlarge, ENLARGE_STOPPED: 'stopped' }));
vi.mock('./print/pdf', () => ({ buildPdf: m.buildPdf }));
vi.mock('./print/draw', () => ({ drawRegion: m.drawRegion, trimmed: (c: HTMLCanvasElement) => c, paintPrint: () => undefined }));
vi.mock('./print/MatPreview', () => ({ MatPreview: ({ label }: { label: string }) => <p>{label}</p> }));
vi.mock('@/lib/tools/print/actions', () => ({ savePiece: m.savePiece, renamePiece: m.renamePiece, deletePiece: m.deletePiece }));

import { PrintTool } from './PrintTool';
import type { PrintPiece } from '@/lib/tools/print/pieces';

const canvas = (w: number, h: number): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};
const picture = (w: number, h: number, name = 'design') => ({ canvas: canvas(w, h), name, pages: 1, page: 1, file: new File(['x'], `${name}.jpg`, { type: 'image/jpeg' }), inches: null });
const TRAY: PrintPiece = { id: 'p1', name: 'Round tray', shape: 'round', widthIn: 12, heightIn: 12, wrapIn: 0.5 };
const tag = (): HTMLElement => screen.getByRole('complementary', { name: 'Print it' });
const downloads: string[] = [];

beforeEach(() => {
  window.localStorage.clear();
  downloads.length = 0;
  m.open.mockImplementation(async (f: File) => picture(1500, 1500, f.name.replace(/\..*$/, '')));
  m.enlarge.mockImplementation(async (src: HTMLCanvasElement, f: number) => canvas(src.width * f, src.height * f));
  m.buildPdf.mockResolvedValue(new Blob(['%PDF']));
  m.drawRegion.mockImplementation(() => ({ canvas: Object.assign(canvas(10, 10), { toBlob: (cb: (b: Blob) => void) => cb(new Blob([new Uint8Array(60)])) }), dpi: 300 }));
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => 'blob:x', revokeObjectURL: () => undefined }));
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    downloads.push(this.download);
  });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function addPicture(name = 'design.jpg', input = 0): Promise<void> {
  const inputs = document.querySelectorAll<HTMLInputElement>('input[type=file]');
  await act(async () => {
    fireEvent.change(inputs[input] as HTMLInputElement, { target: { files: [new File(['x'], name, { type: 'image/jpeg' })] } });
  });
  await waitFor(() => expect(m.open).toHaveBeenCalled());
}
const choosePaper = (value = 'letter'): void => {
  fireEvent.change(screen.getByLabelText('What paper do you print on?'), { target: { value } });
};
const type = (label: string, value: string): void => {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
};

describe('Print it, the three steps', () => {
  it('starts empty, asking for a picture, with More closed', () => {
    render(<PrintTool pieces={[]} products={null} />);
    expect(tag().textContent).toContain('Add your picture to see how it prints.');
    expect((screen.getByRole('button', { name: 'Save the PDF' }) as HTMLButtonElement).disabled).toBe(true);
    expect(document.querySelector('details')?.open).toBe(false);
  });

  it('shows the size, the sheets and that it will be made sharper', async () => {
    render(<PrintTool pieces={[]} products={null} />);
    await addPicture();
    expect(tag().textContent).toContain('8 × 8 in');
    expect(tag().textContent).toContain('on 1 sheet of US Letter');
    expect(tag().textContent).toContain('Made sharper for you when you save');
  });

  it('keeps the proportions, and shows centimetres', async () => {
    m.open.mockResolvedValue(picture(3000, 1500));
    render(<PrintTool pieces={[]} products={null} />);
    await addPicture();
    type('Width', '10');
    expect((screen.getByLabelText('Height') as HTMLInputElement).value).toBe('5');
    fireEvent.blur(screen.getByLabelText('Width'));
    fireEvent.click(screen.getByRole('button', { name: 'cm' }));
    expect((screen.getByLabelText('Width') as HTMLInputElement).value).toBe('25.4');
    expect(window.localStorage.getItem('bohdi.print.unit')).toBe('cm');
  });

  it('ignores a size that isn’t one', async () => {
    render(<PrintTool pieces={[]} products={null} />);
    await addPicture();
    type('Width', 'abc');
    expect(tag().textContent).toContain('8 × 8 in');
    type('Width', '0');
    expect(tag().textContent).toContain('8 × 8 in');
  });

  it('sets a saved piece’s size, and the biggest sharp size', async () => {
    render(<PrintTool pieces={[TRAY]} products={null} />);
    await addPicture();
    fireEvent.click(screen.getByRole('button', { name: 'Round tray' }));
    expect(tag().textContent).toContain('13 × 13 in');
    fireEvent.click(screen.getByRole('button', { name: 'Biggest sharp size' }));
    // 1500 px doubled at 300 DPI is 10 in, less the tray's ½ in wrap on each side, plus the wrap again.
    expect(tag().textContent).toContain('10 × 10 in');
  });

  it('asks for the paper once and remembers it', async () => {
    const { unmount } = render(<PrintTool pieces={[]} products={null} />);
    choosePaper('a4');
    expect(screen.getByText('On A4')).toBeTruthy();
    expect(window.localStorage.getItem('bohdi.print.paper')).toBe('a4');
    unmount();
    render(<PrintTool pieces={[]} products={null} />);
    await waitFor(() => expect(screen.getByText('On A4')).toBeTruthy());
  });

  it('won’t save before the paper is picked', async () => {
    render(<PrintTool pieces={[]} products={null} />);
    await addPicture();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save the PDF' }));
    });
    expect(screen.getByRole('alert').textContent).toBe('Pick the paper you print on first.');
    expect(m.buildPdf).not.toHaveBeenCalled();
  });

  it('makes the picture sharper, then saves the PDF', async () => {
    render(<PrintTool pieces={[]} products={null} />);
    await addPicture();
    choosePaper();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save the PDF' }));
    });
    await waitFor(() => expect(m.buildPdf).toHaveBeenCalled());
    expect(m.enlarge.mock.calls[0]?.[1]).toBe(2);
    const [designs, sheets, unit] = m.buildPdf.mock.calls[0] as [Array<{ src: HTMLCanvasElement; look: { mirror: boolean; brighter: boolean } }>, unknown[], string];
    expect(designs[0]?.src.width).toBe(3000);
    expect(sheets).toHaveLength(1);
    expect(unit).toBe('in');
    expect(downloads).toEqual(['design-8x8in.pdf']);
    expect(screen.getByRole('status').textContent).toBe('Made sharper for you, then saved design-8x8in.pdf.');
  });

  it('still saves, from the original, when the device can’t make it sharper', async () => {
    m.enlarge.mockRejectedValue(new Error('This device couldn’t make the picture sharper.'));
    render(<PrintTool pieces={[]} products={null} />);
    await addPicture();
    choosePaper();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save the PDF' }));
    });
    await waitFor(() => expect(m.buildPdf).toHaveBeenCalled());
    expect((m.buildPdf.mock.calls[0]?.[0] as Array<{ src: HTMLCanvasElement }>)[0]?.src.width).toBe(1500);
    expect(screen.getByRole('status').textContent).toBe('Saved design-8x8in.pdf. Printed as sharp as this device allows.');
  });

  it('stops when the maker presses Stop, saving nothing', async () => {
    m.enlarge.mockImplementation((_s: unknown, _f: unknown, _p: unknown, signal: AbortSignal) => new Promise((_ok, bad) => signal.addEventListener('abort', () => bad(new Error('stopped')))));
    render(<PrintTool pieces={[]} products={null} />);
    await addPicture();
    choosePaper();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save the PDF' }));
    });
    await act(async () => {
      fireEvent.click(await screen.findByRole('button', { name: 'Stop' }));
    });
    await waitFor(() => expect(screen.getByText('Stopped. Nothing was saved.')).toBeTruthy());
    expect(m.buildPdf).not.toHaveBeenCalled();
    expect(downloads).toEqual([]);
  });

  it('says plainly when a file won’t open', async () => {
    m.open.mockRejectedValue(new Error('That file couldn’t be opened. Try a JPG, PNG or PDF.'));
    render(<PrintTool pieces={[]} products={null} />);
    await addPicture('notes.jpg');
    expect(screen.getByRole('alert').textContent).toBe('That file couldn’t be opened. Try a JPG, PNG or PDF.');
  });

  it('saves the size as a piece', async () => {
    m.savePiece.mockResolvedValue({ ok: true, piece: { id: 'p2', name: 'Box lid', shape: 'rect', widthIn: 8, heightIn: 8, wrapIn: 0 } });
    render(<PrintTool pieces={[]} products={null} />);
    await addPicture();
    fireEvent.click(screen.getByRole('button', { name: 'Save this size' }));
    type('Name this size', 'Box lid');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    });
    expect(m.savePiece).toHaveBeenCalledWith({ name: 'Box lid', shape: 'rect', widthIn: 8, heightIn: 8, wrapIn: 0 });
    expect(screen.getByRole('button', { name: 'Box lid' })).toBeTruthy();
  });

  it('renames and removes a piece', async () => {
    m.renamePiece.mockResolvedValue({ ok: true });
    m.deletePiece.mockResolvedValue({ ok: true });
    render(<PrintTool pieces={[TRAY]} products={null} />);
    fireEvent.click(screen.getByRole('button', { name: 'Change my pieces' }));
    type('Name of Round tray', 'Big tray');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save name' }));
    });
    expect(m.renamePiece).toHaveBeenCalledWith('p1', 'Big tray');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove Big tray' }));
    });
    expect(m.deletePiece).toHaveBeenCalledWith('p1');
    expect(screen.queryByRole('button', { name: 'Remove Big tray' })).toBeNull();
  });
});

describe('Print it, More', () => {
  it('mirrors, brightens, and sizes a round piece with its wrap', async () => {
    render(<PrintTool pieces={[]} products={null} />);
    await addPicture();
    choosePaper('tabloid');
    fireEvent.click(screen.getByLabelText(/Mirror the picture/));
    fireEvent.click(screen.getByLabelText(/Brighter for thin paper/));
    fireEvent.click(screen.getByRole('button', { name: 'Round' }));
    type('Width', '10');
    fireEvent.blur(screen.getByLabelText('Width'));
    type('Wrap over the edge', '0.75');
    expect(tag().textContent).toContain('11.5 × 11.5 in');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save the PDF' }));
    });
    await waitFor(() => expect(m.buildPdf).toHaveBeenCalled());
    const d = (m.buildPdf.mock.calls[0]?.[0] as Array<{ job: unknown; look: unknown; cut: unknown }>)[0];
    expect(d).toMatchObject({ job: { w: 11.5, h: 11.5 }, look: { mirror: true, brighter: true }, cut: { shape: 'round', wrapIn: 0.75 } });
  });

  it('keeps a piece’s shape and wrap when saved', async () => {
    m.savePiece.mockResolvedValue({ ok: true, piece: { ...TRAY, id: 'p3' } });
    render(<PrintTool pieces={[]} products={null} />);
    await addPicture();
    fireEvent.click(screen.getByRole('button', { name: 'Round' }));
    type('Wrap over the edge', '0.5');
    fireEvent.click(screen.getByRole('button', { name: 'Save this size' }));
    type('Name this size', 'Round tray');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    });
    expect(m.savePiece).toHaveBeenCalledWith({ name: 'Round tray', shape: 'round', widthIn: 8, heightIn: 8, wrapIn: 0.5 });
  });

  it('fits copies of a small print on one sheet', async () => {
    render(<PrintTool pieces={[]} products={null} />);
    await addPicture();
    type('Width', '3');
    fireEvent.change(screen.getByLabelText('Copies'), { target: { value: '4' } });
    expect(tag().textContent).toContain('4 prints');
    expect(tag().textContent).toContain('on 1 sheet of US Letter');
  });

  it('adds another picture, each with its own size', async () => {
    render(<PrintTool pieces={[]} products={null} />);
    await addPicture('rose.jpg');
    type('Width', '3');
    fireEvent.blur(screen.getByLabelText('Width'));
    await addPicture('fern.jpg', 1);
    expect(screen.getByRole('button', { name: 'fern' }).getAttribute('aria-pressed')).toBe('true');
    expect((screen.getByLabelText('Width') as HTMLInputElement).value).toBe('8');
    expect(tag().textContent).toContain('2 prints');
    fireEvent.click(screen.getByRole('button', { name: 'Remove fern' }));
    expect(tag().textContent).toContain('3 × 3 in');
  });

  it('saves a PNG with its print size written in', async () => {
    m.open.mockResolvedValue(picture(3000, 3000));
    render(<PrintTool pieces={[]} products={null} />);
    await addPicture();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save as a picture (PNG)' }));
    });
    await waitFor(() => expect(downloads).toEqual(['design-8x8in.png']));
    expect(m.enlarge).not.toHaveBeenCalled();
    expect(screen.getByRole('status').textContent).toBe('Saved design-8x8in.png.');
  });

  it('works out the paper for one piece and sends it to Cost to make', async () => {
    render(<PrintTool pieces={[]} products={[{ id: '0f8fad5b-d9cb-469f-a165-70867728950e', name: 'Coasters' }]} />);
    await addPicture();
    type('Width', '3');
    fireEvent.change(screen.getByLabelText('Copies'), { target: { value: '4' } });
    type('One sheet of your paper costs', '1.25');
    expect(screen.getByText(/That’s \$0\.31 of paper for each piece/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Add it in Cost to make' }).getAttribute('href')).toBe('/manage/tools/cost?product=0f8fad5b-d9cb-469f-a165-70867728950e&paper=31&sheets=1');
  });

  it('leaves out the product hand-off when the site has no products', () => {
    render(<PrintTool pieces={[]} products={null} />);
    expect(screen.queryByText('Add the paper to a product')).toBeNull();
  });
});
