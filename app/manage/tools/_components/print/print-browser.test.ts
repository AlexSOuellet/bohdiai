import { describe, it, expect, vi, beforeEach } from 'vitest';

const upscale = vi.hoisted(() => ({ fail: new Set<string>(), made: [] as string[] }));
vi.mock('@tensorflow/tfjs', () => {
  const t = { clipByValue: () => t, cast: () => t, dispose: () => undefined };
  return {
    setBackend: async () => true,
    ready: async () => undefined,
    tidy: (f: () => unknown) => f(),
    browser: { fromPixels: () => ({ dispose: () => undefined }), toPixels: async () => undefined },
  };
});
vi.mock('upscaler', () => ({
  default: class {
    path: string;
    constructor(o: { model: { path: string } }) {
      this.path = o.model.path;
      upscale.made.push(o.model.path);
    }
    async execute(_i: unknown, o: { progress: (r: number) => void; signal: AbortSignal }): Promise<unknown> {
      o.progress(0.5);
      if (o.signal.aborted || [...upscale.fail].some((f) => this.path.includes(f))) throw new Error('no webgl');
      const t = { clipByValue: () => t, cast: () => t, dispose: () => undefined };
      return t;
    }
    async dispose(): Promise<void> {}
  },
}));
vi.mock('@upscalerjs/esrgan-medium/2x', () => ({ default: { modelType: 'layers' } }));
vi.mock('@upscalerjs/esrgan-slim/2x', () => ({ default: { modelType: 'layers' } }));

const pdfDoc = vi.hoisted(() => ({ pages: [] as unknown[], images: [] as unknown[], lines: 0, texts: [] as string[] }));
vi.mock('jspdf', () => ({
  jsPDF: class {
    constructor(o: { format: number[] }) {
      pdfDoc.pages.push(o.format);
    }
    addPage(f: number[]): void {
      pdfDoc.pages.push(f);
    }
    addImage(...a: unknown[]): void {
      pdfDoc.images.push(a.slice(2, 6));
    }
    line(): void {
      pdfDoc.lines++;
    }
    text(t: string): void {
      pdfDoc.texts.push(t);
    }
    setDrawColor(): void {}
    setLineWidth(): void {}
    setFontSize(): void {}
    setTextColor(): void {}
    output(): Blob {
      return new Blob(['%PDF']);
    }
  },
}));
vi.mock('./draw', () => ({ drawRegion: () => ({ canvas: { toDataURL: () => 'data:', width: 1, height: 1 }, dpi: 300 }) }));

const { enlarge, ENLARGE_FAILED, ENLARGE_STOPPED } = await import('./enlarge');
const { buildPdf } = await import('./pdf');
const { openPicture, fitScale, OPEN_FAILED } = await import('./open');
const { planSheets } = await import('@/lib/tools/print/layout');

const src = { width: 100, height: 100 } as HTMLCanvasElement;

beforeEach(() => {
  upscale.fail.clear();
  upscale.made = [];
  pdfDoc.pages = [];
  pdfDoc.images = [];
  pdfDoc.lines = 0;
  pdfDoc.texts = [];
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});

describe('enlarge', () => {
  it('doubles twice for 4×, loading the models from BohdiAI itself, and reports progress', async () => {
    const seen: number[] = [];
    const out = await enlarge(src, 4, (f) => seen.push(f), new AbortController().signal);
    expect(out.width).toBe(400);
    expect(upscale.made).toEqual(['/print-models/medium/model.json', '/print-models/medium/model.json']);
    expect(seen).toEqual([0.25, 0.75]);
  });
  it('falls back to the fast model, then says the device can’t', async () => {
    upscale.fail.add('medium');
    expect((await enlarge(src, 2, () => undefined, new AbortController().signal)).width).toBe(200);
    expect(upscale.made).toContain('/print-models/slim/model.json');
    upscale.fail.add('slim');
    await expect(enlarge(src, 2, () => undefined, new AbortController().signal)).rejects.toThrow(ENLARGE_FAILED);
  });
  it('stops when the maker presses Stop', async () => {
    const c = new AbortController();
    c.abort();
    await expect(enlarge(src, 2, () => undefined, c.signal)).rejects.toThrow(ENLARGE_STOPPED);
  });
});

describe('buildPdf', () => {
  const design = { src, job: { w: 16, h: 20 }, look: { mirror: false, brighter: false }, cut: { shape: 'rect' as const, wrapIn: 0 } };
  it('makes a page per sheet at the paper’s size, with the footer and ruler on each', async () => {
    const { sheets } = planSheets([design.job], 'letter');
    const said: string[] = [];
    const blob = await buildPdf([design], sheets, 'in', '16 × 20 in', (i, n) => said.push(`${i + 1}/${n}`));
    expect(blob.size).toBeGreaterThan(0);
    expect(pdfDoc.pages).toHaveLength(6);
    expect(pdfDoc.pages[0]).toEqual([8.5, 11]);
    expect(said).toEqual(['1/6', '2/6', '3/6', '4/6', '5/6', '6/6']);
    expect(pdfDoc.texts).toContain('Sheet 1 of 6 · print at 100% / Actual size');
    expect(pdfDoc.texts.filter((t) => t === '1 in')).toHaveLength(6);
    expect(pdfDoc.images[0]).toEqual([0.25, 0.25, 8, 10.5]);
  });
  it('a print-shop page carries no marks or footer', async () => {
    const job = { w: 30, h: 40 };
    await buildPdf([{ ...design, job }], planSheets([job], 'print').sheets, 'cm', '76.2 × 101.6 cm', () => undefined);
    expect(pdfDoc.pages).toEqual([[30, 40]]);
    expect(pdfDoc.lines).toBe(0);
    expect(pdfDoc.texts).toEqual([]);
  });
  it('refuses an empty job', async () => {
    await expect(buildPdf([], [], 'in', '', () => undefined)).rejects.toThrow('There’s nothing to print yet.');
  });
});

describe('openPicture', () => {
  it('turns away a file that isn’t a picture or PDF', async () => {
    await expect(openPicture(new File(['x'], 'notes.txt', { type: 'text/plain' }))).rejects.toThrow(OPEN_FAILED);
  });
  it('scales a huge picture to what a phone can hold', () => {
    expect(fitScale(1000, 1000)).toBe(1);
    const k = fitScale(8000, 6000);
    expect(8000 * k * 6000 * k).toBeLessThanOrEqual(16e6 + 1);
    expect(k).toBeGreaterThan(0.5);
  });
});
