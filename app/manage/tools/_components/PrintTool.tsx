'use client';

/**
 * Print it (Alex, 2026-11-15): print any picture at the exact size the maker needs,
 * sharp. Three steps: add the picture, set the size (or pick a saved piece), save
 * the PDF. The tool decides the rest: always 300 DPI, enlarged with AI on the
 * maker's device when the file is too small, fewest sheets, a ¼ in overlap, trim
 * marks and a ruler. The extras sit under More, closed. Spec: Project-Docs/Print-Tool-Design.md.
 */
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { DPI, PAPER_KEYS, SHEETS_MAX, biggestSharp, capSize, enlargeFactor, fmtSize, parseSize, planSheets, sourceDpi, withWrap, type Job, type PaperKey, type Unit } from '@/lib/tools/print/layout';
import { brighten } from '@/lib/tools/print/pixels';
import { withDpi } from '@/lib/tools/print/png';
import { PIECE_WRAP_MAX, type PieceShape, type PrintPiece } from '@/lib/tools/print/pieces';
import { deletePiece, renamePiece, savePiece } from '@/lib/tools/print/actions';
import { paperLink } from '@/lib/tools/handoff';
import { parseDollars } from '@/lib/backend/catalog/product-form';
import { HangTag } from './ToolParts';
import { openPicture, type Picture } from './print/open';
import { drawRegion, trimmed } from './print/draw';
import { ENLARGE_STOPPED, enlarge } from './print/enlarge';
import { buildPdf, type PrintDesign } from './print/pdf';
import { MatPreview, type MatPrint } from './print/MatPreview';

export type ProductChoice = { id: string; name: string };

export const PAPER_NAMES: Readonly<Record<PaperKey, string>> = {
  letter: 'US Letter',
  legal: 'US Legal',
  tabloid: 'Tabloid',
  a4: 'A4',
  a3: 'A3',
  print: 'One page the size of the print',
};
const SHAPE_NAMES: Readonly<Record<PieceShape, string>> = { rect: 'Rectangle', round: 'Round', oval: 'Oval' };
const STORE_PAPER = 'bohdi.print.paper';
const STORE_UNIT = 'bohdi.print.unit';
const START_IN = 8;
const PREVIEW_PX = 900;
const COPIES_MAX = 50;
const PIECE_FAILED = 'The piece couldn’t be saved. Try again in a moment.';

type Pic = {
  key: number;
  pic: Picture;
  ready: HTMLCanvasElement;
  preview: HTMLCanvasElement;
  trim: boolean;
  mirror: boolean;
  w: number;
  h: number;
  ratio: number;
  shape: PieceShape;
  wrapIn: number;
  copies: number;
  sharper: { factor: 2 | 4; canvas: HTMLCanvasElement } | null;
};
type Busy = { say: string; progress: number | null; stop: AbortController | null };
type Say = { text: string; bad: boolean };

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
const noop = (): (() => void) => () => undefined;
function keep(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Remembering is a convenience only.
  }
}

/** A small copy for the preview, so the mat redraws quickly. */
function smallCopy(src: HTMLCanvasElement, bright: boolean): HTMLCanvasElement {
  const k = Math.min(1, PREVIEW_PX / Math.max(src.width, src.height));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(src.width * k));
  c.height = Math.max(1, Math.round(src.height * k));
  const x = c.getContext('2d', { willReadFrequently: true });
  if (x === null) return src;
  x.drawImage(src, 0, 0, c.width, c.height);
  if (bright) {
    const img = x.getImageData(0, 0, c.width, c.height);
    brighten(img.data);
    x.putImageData(img, 0, 0);
  }
  return c;
}

function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

const jobOf = (p: Pic): Job => withWrap({ w: p.w, h: p.h }, p.wrapIn);
const fileName = (s: string): string => s.replace(/[^\w.-]+/g, '_');

export function PrintTool({ pieces: firstPieces, products }: { pieces: PrintPiece[]; products: ProductChoice[] | null }): React.ReactElement {
  const [pics, setPics] = useState<Pic[]>([]);
  const [active, setActive] = useState(0);
  // Remembered on the device; what the maker picks here wins.
  const storedPaper = useSyncExternalStore(noop, () => read(STORE_PAPER), () => null);
  const storedUnit = useSyncExternalStore(noop, () => read(STORE_UNIT), () => null);
  const [unitPick, setUnit] = useState<Unit | null>(null);
  const [paperPick, setPaper] = useState<PaperKey | null>(null);
  const unit: Unit = unitPick ?? (storedUnit === 'cm' ? 'cm' : 'in');
  const paper: PaperKey | null = paperPick ?? (storedPaper !== null && (PAPER_KEYS as readonly string[]).includes(storedPaper) ? (storedPaper as PaperKey) : null);
  const [changingPaper, setChangingPaper] = useState(false);
  const [brighter, setBrighter] = useState(false);
  const [typed, setTyped] = useState<{ w: string; h: string } | null>(null);
  const [pieces, setPieces] = useState<PrintPiece[]>(firstPieces);
  const [naming, setNaming] = useState<string | null>(null);
  const [editingPieces, setEditingPieces] = useState(false);
  const [busy, setBusy] = useState<Busy | null>(null);
  const [say, setSay] = useState<Say | null>(null);
  const [sheetPrice, setSheetPrice] = useState('');
  const [productId, setProductId] = useState(products?.[0]?.id ?? '');
  const nextKey = useRef(1);

  const cur = pics[active] ?? pics[0];

  /** The prints in the job, a copy each, and which picture each one is. */
  const job = useMemo(() => {
    const owner: number[] = [];
    const jobs: Job[] = [];
    pics.forEach((p, i) => {
      for (let c = 0; c < p.copies; c++) {
        owner.push(i);
        jobs.push(jobOf(p));
      }
    });
    return { owner, jobs, plan: planSheets(jobs, paper ?? 'letter') };
  }, [pics, paper]);

  const matPrints = useMemo<MatPrint[]>(
    () =>
      job.owner.map((i) => {
        const p = pics[i] as Pic;
        return { src: brighter ? smallCopy(p.preview, true) : p.preview, job: jobOf(p), look: { mirror: p.mirror, brighter: false }, cut: { shape: p.shape, wrapIn: p.wrapIn } };
      }),
    [job, pics, brighter],
  );

  const update = (key: number, patch: Partial<Pic>): void => setPics((all) => all.map((p) => (p.key === key ? { ...p, ...patch } : p)));

  function startSize(pic: Picture, ratio: number): { w: number; h: number } {
    if (pic.inches !== null) return pic.inches;
    return ratio >= 1 ? { w: START_IN, h: START_IN / ratio } : { w: START_IN * ratio, h: START_IN };
  }

  async function addPicture(file: File | undefined, another: boolean): Promise<void> {
    if (file === undefined) return;
    setSay(null);
    setBusy({ say: `Opening ${file.name}…`, progress: null, stop: null });
    try {
      const pic = await openPicture(file);
      const ratio = pic.canvas.width / pic.canvas.height;
      const size = startSize(pic, ratio);
      const fresh: Pic = { key: nextKey.current++, pic, ready: pic.canvas, preview: smallCopy(pic.canvas, false), trim: false, mirror: false, ...size, ratio, shape: 'rect', wrapIn: 0, copies: 1, sharper: null };
      setTyped(null);
      if (another && pics.length > 0) {
        setPics((all) => [...all, fresh]);
        setActive(pics.length);
      } else {
        setPics([fresh]);
        setActive(0);
      }
    } catch (err) {
      setSay({ text: err instanceof Error ? err.message : 'That file couldn’t be opened.', bad: true });
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    const onPaste = (e: ClipboardEvent): void => {
      const item = [...(e.clipboardData?.items ?? [])].find((i) => i.kind === 'file' && (i.type.startsWith('image/') || i.type === 'application/pdf'));
      const f = item?.getAsFile();
      if (f === null || f === undefined) return;
      e.preventDefault();
      const ext = f.type === 'application/pdf' ? 'pdf' : (f.type.split('/')[1] ?? 'png');
      void addPicture(f.name !== '' && f.name !== 'image.png' ? f : new File([f], `pasted-picture.${ext}`, { type: f.type }), false);
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  });

  async function choosePage(page: number): Promise<void> {
    if (cur === undefined) return;
    setBusy({ say: `Opening page ${page}…`, progress: null, stop: null });
    try {
      const pic = await openPicture(cur.pic.file, page);
      const ready = cur.trim ? trimmed(pic.canvas) : pic.canvas;
      update(cur.key, { pic, ready, preview: smallCopy(ready, false), ratio: ready.width / ready.height, sharper: null });
    } catch (err) {
      setSay({ text: err instanceof Error ? err.message : 'That page couldn’t be opened.', bad: true });
    } finally {
      setBusy(null);
    }
  }

  function setSize(which: 'w' | 'h', text: string): void {
    if (cur === undefined) return;
    const v = parseSize(text, unit);
    const ratio = cur.shape === 'round' ? 1 : cur.ratio;
    if (v === null) {
      setTyped({ w: which === 'w' ? text : fmtSize(cur.w, unit), h: which === 'h' ? text : fmtSize(cur.h, unit) });
      return;
    }
    // Neither side may pass the most a print can be, the other one included.
    const { w, h } = capSize(which === 'w' ? v : v * ratio, which === 'h' ? v : v / ratio);
    update(cur.key, { w, h });
    setTyped({ w: which === 'w' ? text : fmtSize(w, unit), h: which === 'h' ? text : fmtSize(h, unit) });
  }

  function pickPiece(p: PrintPiece): void {
    if (cur === undefined) return;
    setTyped(null);
    update(cur.key, { w: p.widthIn, h: p.heightIn, ratio: p.widthIn / p.heightIn, shape: p.shape, wrapIn: p.wrapIn });
  }

  function biggest(): void {
    if (cur === undefined) return;
    const b = biggestSharp(cur.ready.width, cur.ready.height, 4);
    const less = (n: number): number => Math.max(0.1, n - 2 * cur.wrapIn);
    setTyped(null);
    if (cur.shape === 'round') {
      const s = less(Math.min(b.w, b.h));
      update(cur.key, { w: s, h: s, ratio: 1 });
    } else {
      update(cur.key, { w: less(b.w), h: less(b.h), ratio: cur.ready.width / cur.ready.height });
    }
  }

  function setTrim(on: boolean): void {
    if (cur === undefined) return;
    const ready = on ? trimmed(cur.pic.canvas) : cur.pic.canvas;
    const ratio = ready.width / ready.height;
    setTyped(null);
    update(cur.key, { trim: on, ready, preview: smallCopy(ready, false), ratio, h: cur.shape === 'rect' ? cur.w / ratio : cur.h, sharper: null });
  }

  function setShape(shape: PieceShape): void {
    if (cur === undefined) return;
    setTyped(null);
    update(cur.key, shape === 'round' ? { shape, h: cur.w, ratio: 1 } : { shape });
  }

  function setUnitTo(u: Unit): void {
    setUnit(u);
    setTyped(null);
    keep(STORE_UNIT, u);
  }

  function choosePaper(p: PaperKey): void {
    setPaper(p);
    setChangingPaper(false);
    keep(STORE_PAPER, p);
  }

  async function keepSize(name: string): Promise<void> {
    if (cur === undefined) return;
    let done: Awaited<ReturnType<typeof savePiece>>;
    try {
      done = await savePiece({ name, shape: cur.shape, widthIn: cur.w, heightIn: cur.h, wrapIn: cur.wrapIn });
    } catch {
      setSay({ text: PIECE_FAILED, bad: true });
      return;
    }
    if (!done.ok) {
      setSay({ text: done.error, bad: true });
      return;
    }
    setPieces((all) => [...all, done.piece]);
    setNaming(null);
    setSay({ text: `Saved ${done.piece.name} to your pieces.`, bad: false });
  }

  async function rename(p: PrintPiece, name: string): Promise<void> {
    const done = await renamePiece(p.id, name).catch(() => ({ ok: false as const, error: PIECE_FAILED }));
    if (!done.ok) return setSay({ text: done.error, bad: true });
    setPieces((all) => all.map((x) => (x.id === p.id ? { ...x, name: name.trim() } : x)));
  }

  async function remove(p: PrintPiece): Promise<void> {
    const done = await deletePiece(p.id).catch(() => ({ ok: false as const, error: PIECE_FAILED }));
    if (!done.ok) return setSay({ text: done.error, bad: true });
    setPieces((all) => all.filter((x) => x.id !== p.id));
  }

  /** The picture as sharp as it needs to be at its size, enlarged on the device when
   *  the file is too small. soft: the device couldn't enlarge it. */
  async function sharp(p: Pic, stop: AbortController): Promise<{ src: HTMLCanvasElement; made: boolean; soft: boolean }> {
    const f = enlargeFactor(p.ready.width, p.ready.height, jobOf(p));
    if (f === 1) return { src: p.ready, made: false, soft: sourceDpi(p.ready.width, p.ready.height, jobOf(p)) < DPI - 0.5 };
    if (p.sharper?.factor === f) return { src: p.sharper.canvas, made: true, soft: false };
    setBusy({ say: `Making ${p.pic.name} sharper… keep this page open.`, progress: 0, stop });
    try {
      const canvas = await enlarge(p.ready, f, (x) => setBusy({ say: `Making ${p.pic.name} sharper… keep this page open.`, progress: x, stop }), stop.signal);
      update(p.key, { sharper: { factor: f, canvas } });
      return { src: canvas, made: true, soft: false };
    } catch (err) {
      if (err instanceof Error && err.message === ENLARGE_STOPPED) throw err;
      return { src: p.ready, made: false, soft: true };
    }
  }

  const sizeLabel = (p: Pic): string => {
    const j = jobOf(p);
    return `${fmtSize(j.w, unit)} × ${fmtSize(j.h, unit)} ${unit}`;
  };

  function finished(name: string, made: boolean, soft: boolean): void {
    const lead = made ? `Made sharper for you, then saved ${name}.` : `Saved ${name}.`;
    setSay({ text: soft ? `${lead} Printed as sharp as this device allows.` : lead, bad: false });
  }

  async function savePdf(): Promise<void> {
    if (pics.length === 0 || busy !== null) return;
    if (paper === null) {
      setSay({ text: 'Pick the paper you print on first.', bad: true });
      return;
    }
    if (tooMany) {
      setSay({ text: tooManySay, bad: true });
      return;
    }
    setSay(null);
    const stop = new AbortController();
    try {
      const sharpened = new Map<number, { src: HTMLCanvasElement; made: boolean; soft: boolean }>();
      for (const p of pics) sharpened.set(p.key, await sharp(p, stop));
      const designs: PrintDesign[] = job.owner.map((i) => {
        const p = pics[i] as Pic;
        return { src: (sharpened.get(p.key) as { src: HTMLCanvasElement }).src, job: jobOf(p), look: { mirror: p.mirror, brighter }, cut: { shape: p.shape, wrapIn: p.wrapIn } };
      });
      const first = pics[0] as Pic;
      const { blob, dpi } = await buildPdf(designs, job.plan.sheets, unit, sizeLabel(first), (i, n) => setBusy({ say: `Laying out sheet ${i + 1} of ${n}…`, progress: (i + 1) / n, stop: null }));
      const name = fileName(pics.length === 1 && first.copies === 1 ? `${first.pic.name}-${fmtSize(jobOf(first).w, unit)}x${fmtSize(jobOf(first).h, unit)}${unit}.pdf` : `${first.pic.name}-and-more-${job.plan.sheets.length}-sheets.pdf`);
      download(blob, name);
      const all = [...sharpened.values()];
      finished(name, all.some((s) => s.made), all.some((s) => s.soft) || dpi < DPI);
    } catch (err) {
      setSay(err instanceof Error && err.message === ENLARGE_STOPPED ? { text: 'Stopped. Nothing was saved.', bad: false } : { text: err instanceof Error ? err.message : 'The PDF couldn’t be made.', bad: true });
    } finally {
      setBusy(null);
    }
  }

  async function savePng(): Promise<void> {
    if (cur === undefined || busy !== null) return;
    setSay(null);
    const stop = new AbortController();
    try {
      const s = await sharp(cur, stop);
      setBusy({ say: 'Making the picture…', progress: null, stop: null });
      const j = jobOf(cur);
      const r = drawRegion(s.src, j, { x0: 0, y0: 0, w: j.w, h: j.h }, DPI, { mirror: cur.mirror, brighter }, { shape: cur.shape, wrapIn: cur.wrapIn });
      const blob = await new Promise<Blob>((ok, bad) => r.canvas.toBlob((b) => (b === null ? bad(new Error('This print is too big to save as one picture. Save the PDF instead.')) : ok(b)), 'image/png'));
      const png = withDpi(new Uint8Array(await blob.arrayBuffer()), r.dpi);
      const name = fileName(`${cur.pic.name}-${fmtSize(j.w, unit)}x${fmtSize(j.h, unit)}${unit}.png`);
      download(new Blob([png.slice().buffer], { type: 'image/png' }), name);
      finished(name, s.made, s.soft || r.dpi < DPI);
    } catch (err) {
      setSay(err instanceof Error && err.message === ENLARGE_STOPPED ? { text: 'Stopped. Nothing was saved.', bad: false } : { text: err instanceof Error ? err.message : 'The picture couldn’t be made.', bad: true });
    } finally {
      setBusy(null);
    }
  }

  // What the hang tag says.
  const sheets = job.plan.sheets.length;
  const where = paper === 'print' ? `on ${sheets === 1 ? 'one page' : `${sheets} pages`} the size of the print` : `on ${sheets} ${sheets === 1 ? 'sheet' : 'sheets'} of ${PAPER_NAMES[paper ?? 'letter']}`;
  const verdict = (p: Pic): 'sharp' | 'sharper' | 'soft' => {
    const j = jobOf(p);
    const f = enlargeFactor(p.ready.width, p.ready.height, j);
    if (f === 1) return sourceDpi(p.ready.width, p.ready.height, j) >= DPI - 0.5 ? 'sharp' : 'soft';
    return sourceDpi(p.ready.width, p.ready.height, j) * f >= DPI - 0.5 ? 'sharper' : 'soft';
  };
  const curVerdict = cur === undefined ? null : verdict(cur);
  const anySoft = pics.some((p) => verdict(p) === 'soft');
  const copies = pics.reduce((n, p) => n + p.copies, 0);
  const tooMany = sheets > SHEETS_MAX;
  const tooManySay = `That’s ${sheets} sheets. Try a smaller size or bigger paper.`;

  // Paper to a product: this picture's share of the sheets, for one piece.
  const sheetCents = (() => {
    const d = parseDollars(sheetPrice);
    return d.ok && d.cents !== null && d.cents > 0 ? d.cents : null;
  })();
  const paperEach = (() => {
    if (cur === undefined || sheetCents === null || cur.copies === 0) return null;
    const area = (p: Pic): number => jobOf(p).w * jobOf(p).h * p.copies;
    const total = pics.reduce((n, p) => n + area(p), 0);
    return Math.round((sheets * sheetCents * (area(cur) / total)) / cur.copies);
  })();

  const shown = cur === undefined ? null : typed ?? { w: fmtSize(cur.w, unit), h: fmtSize(cur.h, unit) };

  return (
    <section aria-labelledby="tool-print" className="bk-print">
      <h2 id="tool-print" className="bk-tool-title">
        Print any picture at the exact size you need, sharp
      </h2>
      <p className="bk-tool-lede">Add your picture, set the size, and save a PDF that prints at exactly that size. If the file is too small to print sharp, it’s made sharper for you.</p>

      <div className="bk-tool-main">
        <form className="bk-tool-form" onSubmit={(e) => e.preventDefault()}>
          <section className="bk-section">
            <h3 className="bk-section-title">Your picture</h3>
            <label className="bk-print-drop" data-has={cur === undefined ? undefined : 'true'}>
              <input
                type="file"
                className="bk-print-file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  void addPicture(e.target.files?.[0], false);
                  e.target.value = '';
                }}
              />
              <span className="bk-print-drop-name">{cur === undefined ? 'Add your picture' : cur.pic.name}</span>
              <span className="bk-note">{cur === undefined ? 'A JPG, PNG or PDF. Tap to choose it, drag it here, or paste it.' : `${cur.ready.width} × ${cur.ready.height} pixels · tap to change`}</span>
            </label>
            {cur !== undefined && cur.pic.pages > 1 && (
              <div className="bk-field">
                <label className="bk-label" htmlFor="print-page">
                  Page of the PDF
                </label>
                <select id="print-page" className="bk-input" value={cur.pic.page} onChange={(e) => void choosePage(Number(e.target.value))}>
                  {Array.from({ length: cur.pic.pages }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{`Page ${i + 1}`}</option>
                  ))}
                </select>
              </div>
            )}
          </section>

          <section className="bk-section">
            <h3 className="bk-section-title">Size</h3>
            <div className="bk-print-size">
              <div className="bk-field bk-tool-field">
                <label className="bk-label" htmlFor="print-w">
                  Width
                </label>
                <span className="bk-tool-inp">
                  <input id="print-w" className="bk-tool-num" type="text" inputMode="decimal" autoComplete="off" disabled={cur === undefined} value={shown?.w ?? ''} onChange={(e) => setSize('w', e.target.value)} onBlur={() => setTyped(null)} />
                  <span className="bk-tool-unit">{unit}</span>
                </span>
              </div>
              <div className="bk-field bk-tool-field">
                <label className="bk-label" htmlFor="print-h">
                  Height
                </label>
                <span className="bk-tool-inp">
                  <input id="print-h" className="bk-tool-num" type="text" inputMode="decimal" autoComplete="off" disabled={cur === undefined} value={shown?.h ?? ''} onChange={(e) => setSize('h', e.target.value)} onBlur={() => setTyped(null)} />
                  <span className="bk-tool-unit">{unit}</span>
                </span>
              </div>
              <div className="bk-print-unit" role="group" aria-label="Measure in">
                <button type="button" className="bk-print-unit-btn" aria-pressed={unit === 'in'} onClick={() => setUnitTo('in')}>
                  in
                </button>
                <button type="button" className="bk-print-unit-btn" aria-pressed={unit === 'cm'} onClick={() => setUnitTo('cm')}>
                  cm
                </button>
              </div>
            </div>
            {cur !== undefined && (
              <button type="button" className="bk-link bk-print-link" onClick={biggest}>
                Biggest sharp size
              </button>
            )}

            <div className="bk-print-pieces">
              <p className="bk-label">My pieces</p>
              {pieces.length === 0 && <p className="bk-note">Save a size you use again and again, like a tray or a box lid, and it waits here.</p>}
              {!editingPieces && (
                <div className="bk-print-chips">
                  {pieces.map((p) => (
                    <button key={p.id} type="button" className="bk-print-chip" disabled={cur === undefined} onClick={() => pickPiece(p)}>
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
              {editingPieces && (
                <ul className="bk-print-piece-list">
                  {pieces.map((p) => (
                    <PieceRow key={p.id} piece={p} unit={unit} onRename={(n) => void rename(p, n)} onRemove={() => void remove(p)} />
                  ))}
                </ul>
              )}
              <div className="bk-print-piece-actions">
                {cur !== undefined && naming === null && !editingPieces && (
                  <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" onClick={() => setNaming('')}>
                    Save this size
                  </button>
                )}
                {pieces.length > 0 && naming === null && (
                  <button type="button" className="bk-link bk-print-link" onClick={() => setEditingPieces(!editingPieces)}>
                    {editingPieces ? 'Done' : 'Change my pieces'}
                  </button>
                )}
              </div>
              {naming !== null && (
                <div className="bk-print-name">
                  <label className="bk-label" htmlFor="print-piece-name">
                    Name this size
                  </label>
                  <input id="print-piece-name" className="bk-input" type="text" autoComplete="off" maxLength={60} value={naming} onChange={(e) => setNaming(e.target.value)} />
                  <div className="bk-print-piece-actions">
                    <button type="button" className="bk-btn bk-btn-small" onClick={() => void keepSize(naming)}>
                      Save
                    </button>
                    <button type="button" className="bk-link bk-print-link" onClick={() => setNaming(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="bk-section">
            <h3 className="bk-section-title">Paper</h3>
            {paper !== null && !changingPaper ? (
              <p className="bk-print-paper">
                <span>{`On ${PAPER_NAMES[paper]}`}</span>
                <button type="button" className="bk-link bk-print-link" onClick={() => setChangingPaper(true)}>
                  Change
                </button>
              </p>
            ) : (
              <div className="bk-field">
                <label className="bk-label" htmlFor="print-paper">
                  What paper do you print on?
                </label>
                <select id="print-paper" className="bk-input" value={paper ?? ''} onChange={(e) => choosePaper(e.target.value as PaperKey)}>
                  {paper === null && <option value="">Choose your paper</option>}
                  {PAPER_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {PAPER_NAMES[k]}
                    </option>
                  ))}
                </select>
                <span className="bk-note">Asked once, then remembered on this device.</span>
              </div>
            )}
          </section>

          <div className="bk-print-save">
            <button type="button" className="bk-btn bk-print-go" disabled={cur === undefined || busy !== null} onClick={() => void savePdf()}>
              Save the PDF
            </button>
            {busy !== null && (
              <div className="bk-print-busy" role="status">
                <p className="bk-note">{busy.say}</p>
                {busy.progress !== null && (
                  <progress className="bk-print-progress" max={1} value={busy.progress}>
                    {`${Math.round(busy.progress * 100)}%`}
                  </progress>
                )}
                {busy.stop !== null && (
                  <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" onClick={() => busy.stop?.abort()}>
                    Stop
                  </button>
                )}
              </div>
            )}
            {say !== null && (
              <p className={say.bad ? 'bk-print-say bk-error' : 'bk-print-say'} role={say.bad ? 'alert' : 'status'}>
                {say.text}
              </p>
            )}
          </div>

          <details className="bk-print-more">
            <summary className="bk-print-more-title">More</summary>
            <div className="bk-print-more-body">
              <section className="bk-section">
                <h3 className="bk-section-title">How it prints</h3>
                <div className="bk-checks">
                  <label className="bk-check">
                    <input type="checkbox" disabled={cur === undefined} checked={cur?.mirror ?? false} onChange={(e) => cur !== undefined && update(cur.key, { mirror: e.target.checked })} />
                    Mirror the picture, for transfers that go face-down
                  </label>
                  <label className="bk-check">
                    <input type="checkbox" checked={brighter} onChange={(e) => setBrighter(e.target.checked)} />
                    Brighter for thin paper, so prints don’t wash out on rice paper or tissue
                  </label>
                  <label className="bk-check">
                    <input type="checkbox" disabled={cur === undefined} checked={cur?.trim ?? false} onChange={(e) => setTrim(e.target.checked)} />
                    Trim the white border, so the size is the picture itself
                  </label>
                </div>
              </section>

              <section className="bk-section">
                <h3 className="bk-section-title">The piece you’re covering</h3>
                <div className="bk-print-unit" role="group" aria-label="Shape of the piece">
                  {(['rect', 'round', 'oval'] as const).map((s) => (
                    <button key={s} type="button" className="bk-print-unit-btn" disabled={cur === undefined} aria-pressed={(cur?.shape ?? 'rect') === s} onClick={() => setShape(s)}>
                      {SHAPE_NAMES[s]}
                    </button>
                  ))}
                </div>
                <div className="bk-field bk-tool-field">
                  <label className="bk-label" htmlFor="print-wrap">
                    Wrap over the edge
                  </label>
                  <span className="bk-tool-inp">
                    <WrapInput key={`${cur?.key ?? 0}-${unit}`} id="print-wrap" unit={unit} disabled={cur === undefined} value={cur?.wrapIn ?? 0} onChange={(v) => cur !== undefined && update(cur.key, { wrapIn: v })} />
                    <span className="bk-tool-unit">{unit}</span>
                  </span>
                  <span className="bk-note">Added on every side. Round and oval pieces get their cut line printed.</span>
                </div>
              </section>

              <section className="bk-section">
                <h3 className="bk-section-title">Several pictures on one sheet</h3>
                {pics.length > 0 && (
                  <ul className="bk-print-pics">
                    {pics.map((p, i) => (
                      <li key={p.key} className="bk-print-pic">
                        <button type="button" className="bk-print-chip" aria-pressed={i === active} onClick={() => {
                          setTyped(null);
                          setActive(i);
                        }}>
                          {p.pic.name}
                        </button>
                        <label className="bk-print-copies">
                          Copies
                          <input
                            className="bk-tool-num"
                            type="number"
                            min={1}
                            max={COPIES_MAX}
                            value={p.copies}
                            onChange={(e) => update(p.key, { copies: Math.min(COPIES_MAX, Math.max(1, Math.round(Number(e.target.value) || 1))) })}
                          />
                        </label>
                        {pics.length > 1 && (
                          <button type="button" className="bk-link bk-print-link" onClick={() => {
                            setPics((all) => all.filter((x) => x.key !== p.key));
                            setActive(0);
                          }}>
                            {`Remove ${p.pic.name}`}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <label className="bk-btn bk-btn-quiet bk-btn-small bk-print-add">
                  <input
                    type="file"
                    className="bk-print-file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      void addPicture(e.target.files?.[0], true);
                      e.target.value = '';
                    }}
                  />
                  Add another picture
                </label>
                <p className="bk-note">Each picture keeps its own size. They’re fitted on as few sheets as possible, with room to cut between them.</p>
              </section>

              <section className="bk-section">
                <h3 className="bk-section-title">Other ways to save</h3>
                <button type="button" className="bk-btn bk-btn-quiet" disabled={cur === undefined || busy !== null} onClick={() => void savePng()}>
                  Save as a picture (PNG)
                </button>
                <p className="bk-note">The picture is saved with its print size written in, for photo apps and print shops.</p>
              </section>

              {products !== null && products.length > 0 && (
                <section className="bk-section">
                  <h3 className="bk-section-title">Add the paper to a product</h3>
                  <div className="bk-tool-grid">
                    <div className="bk-field bk-tool-field">
                      <label className="bk-label" htmlFor="print-sheet-price">
                        One sheet of your paper costs
                      </label>
                      <span className="bk-tool-inp">
                        <span className="bk-tool-unit">$</span>
                        <input id="print-sheet-price" className="bk-tool-num" type="text" inputMode="decimal" autoComplete="off" value={sheetPrice} onChange={(e) => setSheetPrice(e.target.value)} />
                      </span>
                    </div>
                    <div className="bk-field">
                      <label className="bk-label" htmlFor="print-product">
                        Product
                      </label>
                      <select id="print-product" className="bk-input" value={productId} onChange={(e) => setProductId(e.target.value)}>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {paperEach !== null && cur !== undefined && productId !== '' ? (
                    <p className="bk-hangtag-next">
                      {`That’s $${(paperEach / 100).toFixed(2)} of paper for each piece. `}
                      <Link className="bk-link" href={paperLink(productId, paperEach, sheets) as Route}>
                        Add it in Cost to make
                      </Link>
                    </p>
                  ) : (
                    <p className="bk-note">Put in what one sheet costs and pick the product.</p>
                  )}
                </section>
              )}
            </div>
          </details>
        </form>

        <div className="bk-tool-side bk-print-side">
          <HangTag label="Print it" title={cur === undefined ? 'Your print' : pics.length > 1 || copies > 1 ? `${copies} prints` : sizeLabel(cur)}>
            {cur === undefined ? (
              <p className="bk-hangtag-say">Add your picture to see how it prints.</p>
            ) : (
              <>
                <p className="bk-hangtag-say">{where}</p>
                {tooMany && <p className="bk-hangtag-say bk-error">{tooManySay}</p>}
                {curVerdict === 'sharp' && (
                  <p className="bk-tool-verdict" data-tone="good">
                    Sharp
                  </p>
                )}
                {curVerdict === 'sharper' && (
                  <p className="bk-tool-verdict" data-tone="good">
                    Made sharper for you when you save
                  </p>
                )}
                {curVerdict === 'soft' && (
                  <p className="bk-tool-verdict" data-tone="warn">
                    Prints a little soft at this size
                  </p>
                )}
                {curVerdict === 'soft' && <p className="bk-hangtag-say">Try Biggest sharp size, or a bigger file.</p>}
                {pics.length > 1 && anySoft && curVerdict !== 'soft' && <p className="bk-hangtag-say">One of the other pictures prints a little soft at its size.</p>}
              </>
            )}
          </HangTag>
          {cur !== undefined && <MatPreview prints={matPrints} sheets={job.plan.sheets} unit={unit} label={`How it lays out: ${where}`} />}
          <section className="bk-print-tips" aria-labelledby="print-tips">
            <h3 id="print-tips" className="bk-print-tips-title">
              Printing so the size comes out right
            </h3>
            <ul>
              <li>In the print window choose Actual size or 100%. Turn off Fit to page.</li>
              <li>Measure the ruler bar after printing. If it isn’t exactly 1 in (or 2 cm), the printer changed the size.</li>
              <li>For a print across several sheets, trim one sheet at the ticks and lay it over the shaded overlap on the next.</li>
              <li>Thin or special paper, like rice paper or tissue: tape it to a sheet of copy paper along the leading edge before it goes through the printer.</li>
            </ul>
          </section>
        </div>
      </div>
    </section>
  );
}

/** The wrap, typed in the maker's unit. */
function WrapInput({ id, unit, value, disabled, onChange }: { id: string; unit: Unit; value: number; disabled: boolean; onChange: (inches: number) => void }): React.ReactElement {
  const [text, setText] = useState(value === 0 ? '' : fmtSize(value, unit));
  return (
    <input
      id={id}
      className="bk-tool-num"
      type="text"
      inputMode="decimal"
      autoComplete="off"
      disabled={disabled}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        if (e.target.value.trim() === '') return onChange(0);
        const v = parseSize(e.target.value, unit);
        if (v !== null) onChange(Math.min(PIECE_WRAP_MAX, v));
      }}
    />
  );
}

function PieceRow({ piece, unit, onRename, onRemove }: { piece: PrintPiece; unit: Unit; onRename: (name: string) => void; onRemove: () => void }): React.ReactElement {
  const [name, setName] = useState(piece.name);
  const id = `print-piece-${piece.id}`;
  return (
    <li className="bk-print-piece-row">
      <label className="bk-sr" htmlFor={id}>{`Name of ${piece.name}`}</label>
      <input id={id} className="bk-input" type="text" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
      <span className="bk-note">{`${fmtSize(piece.widthIn, unit)} × ${fmtSize(piece.heightIn, unit)} ${unit}${piece.shape === 'rect' ? '' : `, ${SHAPE_NAMES[piece.shape].toLowerCase()}`}`}</span>
      <button type="button" className="bk-btn bk-btn-quiet bk-btn-small" disabled={name.trim() === piece.name} onClick={() => onRename(name)}>
        Save name
      </button>
      <button type="button" className="bk-btn bk-btn-danger bk-btn-small" onClick={onRemove}>
        {`Remove ${piece.name}`}
      </button>
    </li>
  );
}
