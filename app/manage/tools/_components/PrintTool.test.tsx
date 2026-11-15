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
vi.mock('./print/FrameEditor', () => ({
  FrameEditor: ({ onChange }: { onChange: (f: { zoom: number; x: number; y: number }) => void }) => (
    <button type="button" onClick={() => onChange({ zoom: 1, x: 0, y: 1 })}>
      Show the top
    </button>
  ),
}));
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
const ID = '0f8fad5b-d9cb-469f-a165-70867728950e';
const tag = (): HTMLElement => screen.getByRole('complementary', { name: 'Print it' });
const downloads: string[] = [];

beforeEach(() => {
  window.localStorage.clear();
  downloads.length = 0;
  m.open.mockImplementation(async (f: File) => picture(1500, 1500, f.name.replace(/\..*$/, '')));
  m.enlarge.mockImplementation(async (src: HTMLCanvasElement, f: number) => canvas(src.width * f, src.height * f));
  m.buildPdf.mockResolvedValue({ blob: new Blob(['%PDF']), dpi: 300 });
  m.drawRegion.mockImplementation(() => ({ canvas: Object.assign(canvas(10, 10), { toBlob: (cb: (b: Blob) => void) => cb(new Blob([new Uint8Array(60)])) }), dpi: 300 }));
  HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback) {
    cb(new Blob([new Uint8Array(60)]));
  };
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => 'blob:x', revokeObjectURL: () => undefined }));
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    downloads.push(this.download);
  });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function addDesign(name = 'design.jpg', label = 'Add your design'): Promise<void> {
  await act(async () => {
    fireEvent.change(screen.getByLabelText(label), { target: { files: [new File(['x'], name, { type: 'image/jpeg' })] } });
  });
  await waitFor(() => expect(m.open).toHaveBeenCalled());
}
const openTab = (name: string): void => {
  fireEvent.click(screen.getByRole('tab', { name }));
};
const choosePaper = (value = 'letter'): void => {
  fireEvent.change(screen.getByLabelText('What paper do you print on?'), { target: { value } });
};
const type = (label: string, value: string): void => {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
};
const save = async (name = 'Save the PDF'): Promise<void> => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name }));
  });
};

describe('Print it opens with what it’s for, then a tab for each job', () => {
  it('explains the tool, offers five tabs, and starts on Resize', () => {
    render(<PrintTool pieces={[]} products={null} />);
    expect(screen.getByText(/gets your designs onto paper at the exact size you need/)).toBeTruthy();
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Resize', 'Fit a piece', 'Several on a sheet', 'Big print', 'Make it sharper']);
    expect(screen.getByRole('tab', { name: 'Resize' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText(/Print one design at the exact size you need/)).toBeTruthy();
    expect(tag().textContent).toContain('Add your design to see how it prints.');
  });
  it('each tab says what it’s for and shows only its own options', () => {
    render(<PrintTool pieces={[]} products={null} />);
    expect(screen.queryByText('Wrap over the edge')).toBeNull();
    openTab('Fit a piece');
    expect(screen.getByText(/Cover something you’ve measured/)).toBeTruthy();
    expect(screen.getByLabelText('Wrap over the edge')).toBeTruthy();
    openTab('Make it sharper');
    expect(screen.getByText(/without printing it/)).toBeTruthy();
    expect(screen.queryByLabelText('What paper do you print on?')).toBeNull();
  });
});

describe('Resize', () => {
  it('shows the size, the sheets and that it will be made sharper', async () => {
    render(<PrintTool pieces={[]} products={null} />);
    await addDesign();
    expect(tag().textContent).toContain('8 × 8 in');
    expect(tag().textContent).toContain('on 1 sheet of US Letter');
    expect(tag().textContent).toContain('Made sharper for you when you save');
  });
  it('keeps the proportions, and shows centimetres', async () => {
    m.open.mockResolvedValue(picture(3000, 1500));
    render(<PrintTool pieces={[]} products={null} />);
    await addDesign();
    type('Width', '10');
    expect((screen.getByLabelText('Height') as HTMLInputElement).value).toBe('5');
    fireEvent.blur(screen.getByLabelText('Width'));
    fireEvent.click(screen.getByRole('button', { name: 'cm' }));
    expect((screen.getByLabelText('Width') as HTMLInputElement).value).toBe('25.4');
    expect(window.localStorage.getItem('bohdi.print.unit')).toBe('cm');
  });
  it('ignores a size that isn’t one', async () => {
    render(<PrintTool pieces={[]} products={null} />);
    await addDesign();
    type('Width', 'abc');
    type('Width', '0');
    expect(tag().textContent).toContain('8 × 8 in');
  });
  it('sets the biggest sharp size', async () => {
    render(<PrintTool pieces={[]} products={null} />);
    await addDesign();
    fireEvent.click(screen.getByRole('button', { name: 'Biggest sharp size' }));
    expect(tag().textContent).toContain('10 × 10 in');
  });
  it('never lets the other side run past 200 in, and refuses a job of too many sheets', async () => {
    m.open.mockResolvedValue(picture(1000, 4000));
    render(<PrintTool pieces={[]} products={null} />);
    await addDesign();
    choosePaper();
    type('Width', '200');
    fireEvent.blur(screen.getByLabelText('Width'));
    expect((screen.getByLabelText('Height') as HTMLInputElement).value).toBe('200');
    expect((screen.getByLabelText('Width') as HTMLInputElement).value).toBe('50');
    expect(tag().textContent).toContain('That’s 130 sheets. Try a smaller size or bigger paper.');
    await save();
    expect(m.buildPdf).not.toHaveBeenCalled();
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
    await addDesign();
    await save();
    expect(screen.getByRole('alert').textContent).toBe('Pick the paper you print on first.');
  });
  it('makes the design sharper, then saves the PDF', async () => {
    render(<PrintTool pieces={[]} products={null} />);
    await addDesign();
    choosePaper();
    await save();
    await waitFor(() => expect(m.buildPdf).toHaveBeenCalled());
    expect(m.enlarge.mock.calls[0]?.[1]).toBe(2);
    expect((m.buildPdf.mock.calls[0]?.[0] as Array<{ src: HTMLCanvasElement }>)[0]?.src.width).toBe(3000);
    expect(downloads).toEqual(['design-8x8in.pdf']);
    expect(screen.getByRole('status').textContent).toBe('Made sharper for you, then saved design-8x8in.pdf.');
  });
  it('still saves, from the original, when the device can’t make it sharper', async () => {
    m.enlarge.mockRejectedValue(new Error('This device couldn’t make the picture sharper.'));
    render(<PrintTool pieces={[]} products={null} />);
    await addDesign();
    choosePaper();
    await save();
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Saved design-8x8in.pdf. Printed as sharp as this device allows.'));
  });
  it('says so when the PDF had to print below 300 DPI', async () => {
    m.open.mockResolvedValue(picture(3000, 3000));
    m.buildPdf.mockResolvedValue({ blob: new Blob(['%PDF']), dpi: 220 });
    render(<PrintTool pieces={[]} products={null} />);
    await addDesign();
    choosePaper('print');
    await save();
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Saved design-8x8in.pdf. Printed as sharp as this device allows.'));
  });
  it('stops when the maker presses Stop, saving nothing', async () => {
    m.enlarge.mockImplementation((_s: unknown, _f: unknown, _p: unknown, signal: AbortSignal) => new Promise((_ok, bad) => signal.addEventListener('abort', () => bad(new Error('stopped')))));
    render(<PrintTool pieces={[]} products={null} />);
    await addDesign();
    choosePaper();
    await save();
    await act(async () => {
      fireEvent.click(await screen.findByRole('button', { name: 'Stop' }));
    });
    await waitFor(() => expect(screen.getByText('Stopped. Nothing was saved.')).toBeTruthy());
    expect(m.buildPdf).not.toHaveBeenCalled();
  });
  it('mirrors and brightens when asked', async () => {
    render(<PrintTool pieces={[]} products={null} />);
    await addDesign();
    choosePaper();
    fireEvent.click(screen.getByLabelText(/Mirror it/));
    fireEvent.click(screen.getByLabelText(/Brighter for thin paper/));
    await save();
    await waitFor(() => expect(m.buildPdf).toHaveBeenCalled());
    expect((m.buildPdf.mock.calls[0]?.[0] as Array<{ look: unknown }>)[0]?.look).toMatchObject({ mirror: true, brighter: true });
  });
  it('saves a PNG with its print size written in', async () => {
    m.open.mockResolvedValue(picture(3000, 3000));
    render(<PrintTool pieces={[]} products={null} />);
    await addDesign();
    await save('Save as a picture (PNG) instead');
    await waitFor(() => expect(downloads).toEqual(['design-8x8in.png']));
  });
  it('says plainly when a file won’t open', async () => {
    m.open.mockRejectedValue(new Error('That file couldn’t be opened. Try a JPG, PNG or PDF.'));
    render(<PrintTool pieces={[]} products={null} />);
    await addDesign('notes.jpg');
    expect(screen.getByRole('alert').textContent).toBe('That file couldn’t be opened. Try a JPG, PNG or PDF.');
  });
});

describe('Fit a piece', () => {
  it('carries the design over and starts at a 4 inch piece', async () => {
    render(<PrintTool pieces={[]} products={null} />);
    await addDesign();
    openTab('Fit a piece');
    expect(tag().textContent).toContain('4 × 4 in');
  });
  it('lets the maker choose which part of a tall design shows', async () => {
    m.open.mockResolvedValue(picture(1000, 2000));
    render(<PrintTool pieces={[]} products={null} />);
    openTab('Fit a piece');
    await addDesign();
    choosePaper();
    expect(screen.getByText('Which part shows')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Show the top' }));
    await save();
    await waitFor(() => expect(m.buildPdf).toHaveBeenCalled());
    expect((m.buildPdf.mock.calls[0]?.[0] as Array<{ look: unknown }>)[0]?.look).toMatchObject({ frame: { zoom: 1, x: 0, y: 1 } });
  });
  it('needs no choosing when the design is the piece’s shape', async () => {
    render(<PrintTool pieces={[]} products={null} />);
    openTab('Fit a piece');
    await addDesign();
    expect(screen.queryByText('Which part shows')).toBeNull();
  });
  it('sizes a round piece with its wrap, and makes a set', async () => {
    render(<PrintTool pieces={[]} products={null} />);
    openTab('Fit a piece');
    await addDesign();
    choosePaper('tabloid');
    fireEvent.click(screen.getByRole('button', { name: 'Round' }));
    type('Across', '10');
    fireEvent.blur(screen.getByLabelText('Across'));
    type('Wrap over the edge', '0.75');
    expect(tag().textContent).toContain('11.5 × 11.5 in');
    type('How many', '2');
    expect(tag().textContent).toContain('2 prints');
    await save();
    await waitFor(() => expect(m.buildPdf).toHaveBeenCalled());
    const d = (m.buildPdf.mock.calls[0]?.[0] as Array<{ job: unknown; cut: unknown }>)[0];
    expect(d).toMatchObject({ job: { w: 11.5, h: 11.5 }, cut: { shape: 'round', wrapIn: 0.75 } });
  });
  it('a rectangle piece takes its own width and height', async () => {
    render(<PrintTool pieces={[]} products={null} />);
    openTab('Fit a piece');
    await addDesign();
    type('Width', '6');
    fireEvent.blur(screen.getByLabelText('Width'));
    expect(tag().textContent).toContain('6 × 4 in');
  });
  it('picks a saved piece, and saves one with its shape and wrap', async () => {
    m.savePiece.mockResolvedValue({ ok: true, piece: { id: 'p2', name: 'Coaster', shape: 'round', widthIn: 4, heightIn: 4, wrapIn: 0.25 } });
    render(<PrintTool pieces={[TRAY]} products={null} />);
    openTab('Fit a piece');
    await addDesign();
    fireEvent.click(screen.getByRole('button', { name: 'Round tray' }));
    expect(tag().textContent).toContain('13 × 13 in');
    type('Across', '4');
    fireEvent.blur(screen.getByLabelText('Across'));
    type('Wrap over the edge', '0.25');
    fireEvent.click(screen.getByRole('button', { name: 'Save this piece' }));
    type('Name this piece', 'Coaster');
    await save('Save');
    expect(m.savePiece).toHaveBeenCalledWith({ name: 'Coaster', shape: 'round', widthIn: 4, heightIn: 4, wrapIn: 0.25 });
    expect(screen.getByRole('button', { name: 'Coaster' })).toBeTruthy();
  });
  it('shows a message when saving a piece fails on the way', async () => {
    m.savePiece.mockRejectedValue(new Error('network'));
    render(<PrintTool pieces={[]} products={null} />);
    openTab('Fit a piece');
    await addDesign();
    fireEvent.click(screen.getByRole('button', { name: 'Save this piece' }));
    type('Name this piece', 'Box lid');
    await save('Save');
    expect(screen.getByRole('alert').textContent).toBe('The piece couldn’t be saved. Try again in a moment.');
  });
  it('renames and removes a piece', async () => {
    m.renamePiece.mockResolvedValue({ ok: true });
    m.deletePiece.mockResolvedValue({ ok: true });
    render(<PrintTool pieces={[TRAY]} products={null} />);
    openTab('Fit a piece');
    fireEvent.click(screen.getByRole('button', { name: 'Change my pieces' }));
    type('Name of Round tray', 'Big tray');
    await save('Save name');
    expect(m.renamePiece).toHaveBeenCalledWith('p1', 'Big tray');
    await save('Remove Big tray');
    expect(m.deletePiece).toHaveBeenCalledWith('p1');
  });
  it('works out the paper for one piece of a set and sends it to Cost to make', async () => {
    render(<PrintTool pieces={[]} products={[{ id: ID, name: 'Coasters' }]} />);
    openTab('Fit a piece');
    await addDesign();
    type('How many', '4');
    type('One sheet of your paper costs', '1.25');
    expect(screen.getByText(/That’s \$0\.63 of paper for each piece/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Add it in Cost to make' }).getAttribute('href')).toBe(`/manage/tools/cost?product=${ID}&paper=63&sheets=2`);
  });
});

describe('Several on a sheet', () => {
  it('lists the designs, each with its own size and copies, on as few sheets as possible', async () => {
    render(<PrintTool pieces={[]} products={null} />);
    openTab('Several on a sheet');
    await addDesign('rose.jpg');
    type('Width', '3');
    fireEvent.blur(screen.getByLabelText('Width'));
    await addDesign('fern.jpg', 'Add another design');
    expect(screen.getByRole('button', { name: 'fern' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Size of fern')).toBeTruthy();
    type('Width', '3');
    fireEvent.change(screen.getAllByLabelText('Copies')[0] as HTMLElement, { target: { value: '3' } });
    expect(tag().textContent).toContain('4 prints');
    expect(tag().textContent).toContain('on 1 sheet of US Letter');
    fireEvent.click(screen.getByRole('button', { name: 'Remove fern' }));
    expect(tag().textContent).toContain('3 prints');
  });
});

describe('Big print', () => {
  it('splits a big design across sheets and says how to join them', async () => {
    render(<PrintTool pieces={[]} products={null} />);
    openTab('Big print');
    await addDesign();
    type('Width', '16');
    expect(tag().textContent).toContain('on 6 sheets of US Letter');
    expect(screen.getByText('Printing and joining the sheets')).toBeTruthy();
  });
  it('says when there’s nothing to join', async () => {
    render(<PrintTool pieces={[]} products={null} />);
    openTab('Big print');
    await addDesign();
    expect(tag().textContent).toContain('This fits on one sheet, so there’s nothing to join.');
  });
});

describe('Make it sharper', () => {
  it('shows how big it prints sharp, then saves a sharper copy', async () => {
    render(<PrintTool pieces={[]} products={null} />);
    openTab('Make it sharper');
    await addDesign();
    expect(tag().textContent).toContain('Prints sharp up to 5 × 5 in now.');
    expect(tag().textContent).toContain('Made twice as big: up to 10 × 10 in.');
    await save('Make it sharper and save');
    await waitFor(() => expect(downloads).toEqual(['design-sharper.png']));
    expect(m.enlarge.mock.calls[0]?.[1]).toBe(2);
    expect(screen.getByRole('status').textContent).toBe('Saved design-sharper.png. It now prints sharp up to 10 × 10 in.');
  });
  it('says so when the device can’t', async () => {
    m.enlarge.mockRejectedValue(new Error('no'));
    render(<PrintTool pieces={[]} products={null} />);
    openTab('Make it sharper');
    await addDesign();
    await save('Make it sharper and save');
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('This device couldn’t make the picture sharper. Try it on a computer.'));
  });
});

it('leaves out the product hand-off when the site has no products', () => {
  render(<PrintTool pieces={[]} products={null} />);
  expect(screen.queryByText('Add the paper to a product')).toBeNull();
});
