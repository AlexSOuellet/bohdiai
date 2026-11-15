'use client';

/**
 * Print it (Alex, 2026-11-15): gets the maker's designs onto paper at the exact size
 * they need, sharp. The page opens with what the tool is for, then a tab for each
 * thing a maker comes to do; each tab shows only that job's options. The tool makes
 * the technical calls itself: always 300 DPI, enlarged with AI on the maker's device
 * when the file is too small, fewest sheets, a ¼ in overlap, trim marks and a ruler.
 * Where the picture's shape differs from the print's, the maker drags and zooms to
 * choose which part shows. Spec: Project-Docs/Print-Tool-Design.md.
 */
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import {
  DPI,
  FILL,
  MAX_AREA,
  PAPER_KEYS,
  SHEETS_MAX,
  biggestSharp,
  capSize,
  clampZoom,
  enlargeFactor,
  fillsSheet,
  fmtSize,
  parseSize,
  planSheets,
  sourceDpi,
  withWrap,
  type Frame,
  type Job,
  type PaperKey,
  type Unit,
} from '@/lib/tools/print/layout';
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
import { FrameEditor } from './print/FrameEditor';

export type ProductChoice = { id: string; name: string };
export type PrintTab = 'resize' | 'piece' | 'several' | 'big' | 'sharper';

export const PAPER_NAMES: Readonly<Record<PaperKey, string>> = {
  letter: 'US Letter',
  legal: 'US Legal',
  tabloid: 'Tabloid',
  a4: 'A4',
  a3: 'A3',
  print: 'One page the size of the print',
};

/** The tabs, in order, with what each one is for. */
const TABS: ReadonlyArray<{ key: PrintTab; name: string; about: string }> = [
  {
    key: 'resize',
    name: 'Resize',
    about:
      'Print one design at the exact size you need. Type the width or the height and the other follows, so nothing gets stretched.',
  },
  {
    key: 'piece',
    name: 'Fit a piece',
    about:
      'Cover something you’ve measured, like a coaster, a tray or a box lid. Give its shape and size, how much should wrap over the edge, and choose which part of the picture shows.',
  },
  {
    key: 'several',
    name: 'Several on a sheet',
    about:
      'Fill a sheet with designs, or copies of one, so no paper goes to waste. Each design keeps its own size, and they’re fitted on as few sheets as possible with room to cut between them.',
  },
  {
    key: 'big',
    name: 'Big print',
    about:
      'Print a design bigger than your paper. It’s split across sheets that overlap by ¼ inch and are numbered in order, so you can trim them and join them up.',
  },
  {
    key: 'sharper',
    name: 'Make it sharper',
    about:
      'Turn a small or blurry file into a bigger, sharper picture, without printing it. Handy for a print shop or another app.',
  },
];

const SHAPE_NAMES: Readonly<Record<PieceShape, string>> = {
  rect: 'Rectangle',
  round: 'Round',
  oval: 'Oval',
};
const STORE_PAPER = 'bohdi.print.paper';
const STORE_UNIT = 'bohdi.print.unit';
const START_IN = 8;
const PIECE_START_IN = 4;
const PREVIEW_PX = 900;
const COPIES_MAX = 50;
const PIECE_FAILED = 'The piece couldn’t be saved. Try again in a moment.';

/** One design as a tab holds it. ratio: width over height (the picture's, or the piece's). */
type Design = {
  key: number;
  pic: Picture;
  ready: HTMLCanvasElement;
  preview: HTMLCanvasElement;
  trim: boolean;
  w: number;
  h: number;
  shape: PieceShape;
  wrapIn: number;
  copies: number;
  frame: Frame;
  /** Fill any space around a zoomed-out design by mirroring it outward. */
  extend: boolean;
  sharper: { factor: 2 | 4; canvas: HTMLCanvasElement } | null;
};
type Busy = { say: string; progress: number | null; stop: AbortController | null };
type Say = { text: string; bad: boolean };
type Sharp = { src: HTMLCanvasElement; made: boolean; soft: boolean };

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

/** A small copy for the previews, so they redraw quickly. */
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

const jobOf = (d: Design): Job => withWrap({ w: d.w, h: d.h }, d.wrapIn);
const ratioOf = (d: Design): number => d.ready.width / d.ready.height;
const fileName = (s: string): string => s.replace(/[^\w.-]+/g, '_');

let nextKey = 1;
/** A design from a picture, at a starting size in proportion (a PDF keeps its own page size). */
function designOf(pic: Picture, ready: HTMLCanvasElement, startIn: number): Design {
  const r = ready.width / ready.height;
  const size =
    pic.inches ?? (r >= 1 ? { w: startIn, h: startIn / r } : { w: startIn * r, h: startIn });
  return {
    key: nextKey++,
    pic,
    ready,
    preview: smallCopy(ready, false),
    trim: false,
    ...size,
    shape: 'rect',
    wrapIn: 0,
    copies: 1,
    frame: FILL,
    extend: false,
    sharper: null,
  };
}

/** canSavePieces: false on the share-only try-the-tools page, where there's no account to keep them in. */
export function PrintTool({
  pieces: firstPieces,
  products,
  canSavePieces = true,
}: {
  pieces: PrintPiece[];
  products: ProductChoice[] | null;
  canSavePieces?: boolean;
}): React.ReactElement {
  const [tab, setTab] = useState<PrintTab>('resize');
  const [one, setOne] = useState<Design | null>(null);
  // Fit a piece: one piece, any number of designs on it (Alex, 2026-11-15).
  const [pieceSet, setPieceSet] = useState<Design[]>([]);
  const [pieceActive, setPieceActive] = useState(0);
  const [many, setMany] = useState<Design[]>([]);
  const [active, setActive] = useState(0);
  // Remembered on the device; what the maker picks here wins.
  const storedPaper = useSyncExternalStore(
    noop,
    () => read(STORE_PAPER),
    () => null,
  );
  const storedUnit = useSyncExternalStore(
    noop,
    () => read(STORE_UNIT),
    () => null,
  );
  const [unitPick, setUnitPick] = useState<Unit | null>(null);
  const [paperPick, setPaperPick] = useState<PaperKey | null>(null);
  const unit: Unit = unitPick ?? (storedUnit === 'cm' ? 'cm' : 'in');
  const paper: PaperKey | null =
    paperPick ??
    (storedPaper !== null && (PAPER_KEYS as readonly string[]).includes(storedPaper)
      ? (storedPaper as PaperKey)
      : null);
  const [changingPaper, setChangingPaper] = useState(false);
  const [mirror, setMirror] = useState(false);
  const [brighter, setBrighter] = useState(false);
  const [typed, setTyped] = useState<{ w: string; h: string } | null>(null);
  const [pieces, setPieces] = useState<PrintPiece[]>(firstPieces);
  const [naming, setNaming] = useState<string | null>(null);
  const [editingPieces, setEditingPieces] = useState(false);
  const [busy, setBusy] = useState<Busy | null>(null);
  const [say, setSay] = useState<Say | null>(null);
  const [sheetPrice, setSheetPrice] = useState('');
  const [productId, setProductId] = useState(products?.[0]?.id ?? '');
  const [sharperBy, setSharperBy] = useState<2 | 4>(2);

  /** The design the tab's fields change. */
  const cur: Design | null =
    tab === 'piece'
      ? (pieceSet[pieceActive] ?? pieceSet[0] ?? null)
      : tab === 'several'
        ? (many[active] ?? many[0] ?? null)
        : one;
  /** Every print in this tab's job (several: each design's copies). */
  const designs: Design[] = useMemo(
    () =>
      tab === 'piece'
        ? pieceSet
        : tab === 'several'
          ? many
          : tab === 'sharper' || one === null
            ? []
            : [{ ...one, copies: 1 }],
    [tab, one, pieceSet, many],
  );

  const job = useMemo(() => {
    const owner: number[] = [];
    const jobs: Job[] = [];
    designs.forEach((d, i) => {
      for (let c = 0; c < d.copies; c++) {
        owner.push(i);
        jobs.push(jobOf(d));
      }
    });
    return { owner, plan: planSheets(jobs, paper ?? 'letter') };
  }, [designs, paper]);

  const brightPreviews = useMemo(
    () => new Map(designs.map((d) => [d.key, brighter ? smallCopy(d.preview, true) : d.preview])),
    [designs, brighter],
  );
  const matPrints = useMemo<MatPrint[]>(
    () =>
      job.owner.map((i) => {
        const d = designs[i] as Design;
        return {
          src: brightPreviews.get(d.key) ?? d.preview,
          job: jobOf(d),
          look: { mirror, brighter: false, frame: d.frame, extend: d.extend },
          cut: { shape: d.shape, wrapIn: d.wrapIn },
        };
      }),
    [job, designs, brightPreviews, mirror],
  );

  /** Changes the design the tab is working on. */
  function change(patch: Partial<Design>): void {
    if (cur === null) return;
    const key = cur.key;
    if (tab === 'piece') {
      // The piece itself is shared by every design on it; the rest is each design's own.
      const { w, h, shape, wrapIn, ...own } = patch;
      const shared: Partial<Design> = {
        ...(w === undefined ? {} : { w }),
        ...(h === undefined ? {} : { h }),
        ...(shape === undefined ? {} : { shape }),
        ...(wrapIn === undefined ? {} : { wrapIn }),
      };
      setPieceSet((all) => all.map((d) => ({ ...d, ...shared, ...(d.key === key ? own : {}) })));
    } else if (tab === 'several')
      setMany((all) => all.map((d) => (d.key === key ? { ...d, ...patch } : d)));
    else setOne((d) => (d === null ? d : { ...d, ...patch }));
  }

  function chooseTab(t: PrintTab): void {
    setTab(t);
    setTyped(null);
    setSay(null);
    setNaming(null);
  }

  async function addPicture(file: File | undefined, another: boolean): Promise<void> {
    if (file === undefined) return;
    setSay(null);
    setBusy({ say: `Opening ${file.name}…`, progress: null, stop: null });
    try {
      const pic = await openPicture(file);
      setTyped(null);
      const seed = (startIn: number): Design => designOf(pic, pic.canvas, startIn);
      // A design on the piece takes the piece's own shape and size (4 in square to start).
      const first = pieceSet[0];
      const onPiece = (d: Design): Design =>
        first === undefined
          ? { ...d, w: PIECE_START_IN, h: PIECE_START_IN }
          : { ...d, w: first.w, h: first.h, shape: first.shape, wrapIn: first.wrapIn };
      // The picture carries to the other tabs that have none yet.
      if (tab === 'several') {
        if (another && many.length > 0) {
          setMany((all) => [...all, seed(START_IN)]);
          setActive(many.length);
        } else {
          setMany([seed(START_IN)]);
          setActive(0);
        }
        if (one === null) setOne(seed(START_IN));
        if (pieceSet.length === 0) setPieceSet([onPiece(seed(PIECE_START_IN))]);
      } else if (tab === 'piece') {
        const fresh = onPiece(seed(PIECE_START_IN));
        if (another && pieceSet.length > 0) {
          setPieceSet((all) => [...all, fresh]);
          setPieceActive(pieceSet.length);
        } else {
          setPieceSet((all) =>
            all.length === 0
              ? [fresh]
              : all.map((d, i) => (i === pieceActive ? { ...fresh, copies: d.copies } : d)),
          );
        }
        if (one === null) setOne(seed(START_IN));
        if (many.length === 0) setMany([seed(START_IN)]);
      } else {
        setOne(seed(START_IN));
        if (pieceSet.length === 0) setPieceSet([onPiece(seed(PIECE_START_IN))]);
        if (many.length === 0) setMany([seed(START_IN)]);
      }
    } catch (err) {
      setSay({
        text: err instanceof Error ? err.message : 'That file couldn’t be opened.',
        bad: true,
      });
    } finally {
      setBusy(null);
    }
  }

  // Pasting a picture anywhere on the page adds it to the tab in view.
  const pasteTo = useRef(addPicture);
  useEffect(() => {
    pasteTo.current = addPicture;
  });
  useEffect(() => {
    const onPaste = (e: ClipboardEvent): void => {
      const item = [...(e.clipboardData?.items ?? [])].find(
        (i) => i.kind === 'file' && (i.type.startsWith('image/') || i.type === 'application/pdf'),
      );
      const f = item?.getAsFile();
      if (f === null || f === undefined) return;
      e.preventDefault();
      const ext = f.type === 'application/pdf' ? 'pdf' : (f.type.split('/')[1] ?? 'png');
      void pasteTo.current(
        f.name !== '' && f.name !== 'image.png'
          ? f
          : new File([f], `pasted-picture.${ext}`, { type: f.type }),
        false,
      );
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, []);

  async function choosePage(page: number): Promise<void> {
    if (cur === null) return;
    setBusy({ say: `Opening page ${page}…`, progress: null, stop: null });
    try {
      const pic = await openPicture(cur.pic.file, page);
      const ready = cur.trim ? trimmed(pic.canvas) : pic.canvas;
      const r = ready.width / ready.height;
      change({
        pic,
        ready,
        preview: smallCopy(ready, false),
        frame: FILL,
        sharper: null,
        ...(tab === 'piece' ? {} : { h: cur.w / r }),
      });
    } catch (err) {
      setSay({
        text: err instanceof Error ? err.message : 'That page couldn’t be opened.',
        bad: true,
      });
    } finally {
      setBusy(null);
    }
  }

  function setTrim(on: boolean): void {
    if (cur === null) return;
    const ready = on ? trimmed(cur.pic.canvas) : cur.pic.canvas;
    const r = ready.width / ready.height;
    setTyped(null);
    change({
      trim: on,
      ready,
      preview: smallCopy(ready, false),
      frame: FILL,
      sharper: null,
      ...(tab === 'piece' ? {} : { h: cur.w / r }),
    });
  }

  /** A typed size. In proportion on every tab but Fit a piece, where a piece has its own shape. */
  function setSize(which: 'w' | 'h', text: string): void {
    if (cur === null) return;
    const v = parseSize(text, unit);
    const fixed = tab === 'piece' && cur.shape !== 'round';
    if (v === null) {
      setTyped({
        w: which === 'w' ? text : fmtSize(cur.w, unit),
        h: which === 'h' ? text : fmtSize(cur.h, unit),
      });
      return;
    }
    let size: Job;
    if (fixed) size = which === 'w' ? { w: v, h: cur.h } : { w: cur.w, h: v };
    else if (tab === 'piece') size = { w: v, h: v };
    else {
      const r = ratioOf(cur);
      // Neither side may pass the most a print can be, the other one included.
      size = capSize(which === 'w' ? v : v * r, which === 'h' ? v : v / r);
    }
    // A new piece shape changes how far out the picture can zoom.
    change({
      ...size,
      ...(tab === 'piece'
        ? {
            frame: {
              ...cur.frame,
              zoom: clampZoom(
                cur.frame.zoom,
                cur.ready.width,
                cur.ready.height,
                withWrap(size, cur.wrapIn),
              ),
            },
          }
        : {}),
    });
    setTyped({
      w: which === 'w' ? text : fmtSize(size.w, unit),
      h: which === 'h' ? text : fmtSize(size.h, unit),
    });
  }

  function biggest(): void {
    if (cur === null) return;
    const b = biggestSharp(cur.ready.width, cur.ready.height, 4);
    setTyped(null);
    change({ w: b.w, h: b.h });
  }

  function pickPiece(p: PrintPiece): void {
    setTyped(null);
    change({ w: p.widthIn, h: p.heightIn, shape: p.shape, wrapIn: p.wrapIn, frame: FILL });
  }

  function setShape(shape: PieceShape): void {
    if (cur === null) return;
    setTyped(null);
    change(shape === 'round' ? { shape, h: cur.w, frame: FILL } : { shape, frame: FILL });
  }

  function setUnit(u: Unit): void {
    setUnitPick(u);
    setTyped(null);
    keep(STORE_UNIT, u);
  }

  function choosePaper(p: PaperKey): void {
    setPaperPick(p);
    setChangingPaper(false);
    keep(STORE_PAPER, p);
  }

  async function keepSize(name: string): Promise<void> {
    if (cur === null) return;
    let done: Awaited<ReturnType<typeof savePiece>>;
    try {
      done = await savePiece({
        name,
        shape: cur.shape,
        widthIn: cur.w,
        heightIn: cur.h,
        wrapIn: cur.wrapIn,
      });
    } catch {
      setSay({ text: PIECE_FAILED, bad: true });
      return;
    }
    if (!done.ok) {
      setSay({ text: done.error, bad: true });
      return;
    }
    const saved = done.piece;
    setPieces((all) => [...all, saved]);
    setNaming(null);
    setSay({ text: `Saved ${saved.name} to your pieces.`, bad: false });
  }

  async function rename(p: PrintPiece, name: string): Promise<void> {
    const done = await renamePiece(p.id, name).catch(() => ({
      ok: false as const,
      error: PIECE_FAILED,
    }));
    if (!done.ok) return setSay({ text: done.error, bad: true });
    setPieces((all) => all.map((x) => (x.id === p.id ? { ...x, name: name.trim() } : x)));
  }

  async function remove(p: PrintPiece): Promise<void> {
    const done = await deletePiece(p.id).catch(() => ({ ok: false as const, error: PIECE_FAILED }));
    if (!done.ok) return setSay({ text: done.error, bad: true });
    setPieces((all) => all.filter((x) => x.id !== p.id));
  }

  /** The design as sharp as it needs to be at its size, enlarged on the device when the
   *  file is too small. soft: the device couldn't enlarge it enough. */
  async function sharp(d: Design, stop: AbortController): Promise<Sharp> {
    const f = enlargeFactor(d.ready.width, d.ready.height, jobOf(d), d.frame);
    if (f === 1)
      return {
        src: d.ready,
        made: false,
        soft: sourceDpi(d.ready.width, d.ready.height, jobOf(d), d.frame) < DPI - 0.5,
      };
    if (d.sharper?.factor === f) return { src: d.sharper.canvas, made: true, soft: false };
    const canvas = await enlarging(d, f, stop);
    return canvas === null
      ? { src: d.ready, made: false, soft: true }
      : { src: canvas, made: true, soft: false };
  }

  /** Enlarges a design, keeping the result for the next save. Null when the device can't. */
  async function enlarging(
    d: Design,
    f: 2 | 4,
    stop: AbortController,
  ): Promise<HTMLCanvasElement | null> {
    const words = `Making ${d.pic.name} sharper… keep this page open.`;
    setBusy({ say: words, progress: 0, stop });
    try {
      const canvas = await enlarge(
        d.ready,
        f,
        (x) => setBusy({ say: words, progress: x, stop }),
        stop.signal,
      );
      const keepIt = (x: Design): Design =>
        x.key === d.key ? { ...x, sharper: { factor: f, canvas } } : x;
      setOne((x) => (x === null ? x : keepIt(x)));
      setPieceSet((all) => all.map(keepIt));
      setMany((all) => all.map(keepIt));
      return canvas;
    } catch (err) {
      if (err instanceof Error && err.message === ENLARGE_STOPPED) throw err;
      return null;
    }
  }

  const sizeLabel = (d: Design): string => {
    const j = jobOf(d);
    return `${fmtSize(j.w, unit)} × ${fmtSize(j.h, unit)} ${unit}`;
  };

  function finished(name: string, made: boolean, soft: boolean): void {
    const lead = made ? `Made sharper for you, then saved ${name}.` : `Saved ${name}.`;
    setSay({ text: soft ? `${lead} Printed as sharp as this device allows.` : lead, bad: false });
  }

  function failed(err: unknown, fallback: string): void {
    setSay(
      err instanceof Error && err.message === ENLARGE_STOPPED
        ? { text: 'Stopped. Nothing was saved.', bad: false }
        : { text: err instanceof Error ? err.message : fallback, bad: true },
    );
  }

  const sheets = job.plan.sheets.length;
  const tooMany = sheets > SHEETS_MAX;
  const tooManySay = `That’s ${sheets} sheets. Try a smaller size or bigger paper.`;

  async function savePdf(): Promise<void> {
    if (designs.length === 0 || busy !== null) return;
    if (paper === null) return setSay({ text: 'Pick the paper you print on first.', bad: true });
    if (tooMany) return setSay({ text: tooManySay, bad: true });
    setSay(null);
    const stop = new AbortController();
    try {
      const sharpened = new Map<number, Sharp>();
      for (const d of designs) sharpened.set(d.key, await sharp(d, stop));
      const prints: PrintDesign[] = job.owner.map((i) => {
        const d = designs[i] as Design;
        return {
          src: (sharpened.get(d.key) as Sharp).src,
          job: jobOf(d),
          look: { mirror, brighter, frame: d.frame, extend: d.extend },
          cut: { shape: d.shape, wrapIn: d.wrapIn },
        };
      });
      const first = designs[0] as Design;
      const { blob, dpi } = await buildPdf(
        prints,
        job.plan.sheets,
        unit,
        sizeLabel(first),
        (i, n) =>
          setBusy({ say: `Laying out sheet ${i + 1} of ${n}…`, progress: (i + 1) / n, stop: null }),
      );
      const j = jobOf(first);
      const name = fileName(
        designs.length === 1 && first.copies === 1
          ? `${first.pic.name}-${fmtSize(j.w, unit)}x${fmtSize(j.h, unit)}${unit}.pdf`
          : `${first.pic.name}-and-more-${sheets}-sheets.pdf`,
      );
      download(blob, name);
      const all = [...sharpened.values()];
      finished(
        name,
        all.some((s) => s.made),
        all.some((s) => s.soft) || dpi < DPI,
      );
    } catch (err) {
      failed(err, 'The PDF couldn’t be made.');
    } finally {
      setBusy(null);
    }
  }

  /** The design as one picture file at its print size, with the size written in. */
  async function savePng(): Promise<void> {
    if (cur === null || busy !== null) return;
    setSay(null);
    const stop = new AbortController();
    try {
      const s = await sharp(cur, stop);
      setBusy({ say: 'Making the picture…', progress: null, stop: null });
      const j = jobOf(cur);
      const r = drawRegion(
        s.src,
        j,
        { x0: 0, y0: 0, w: j.w, h: j.h },
        DPI,
        { mirror, brighter, frame: cur.frame, extend: cur.extend },
        { shape: cur.shape, wrapIn: cur.wrapIn },
      );
      const name = fileName(
        `${cur.pic.name}-${fmtSize(j.w, unit)}x${fmtSize(j.h, unit)}${unit}.png`,
      );
      await savePicture(r.canvas, r.dpi, name);
      finished(name, s.made, s.soft || r.dpi < DPI);
    } catch (err) {
      failed(err, 'The picture couldn’t be made.');
    } finally {
      setBusy(null);
    }
  }

  async function savePicture(canvas: HTMLCanvasElement, dpi: number, name: string): Promise<void> {
    const blob = await new Promise<Blob>((ok, bad) =>
      canvas.toBlob(
        (b) =>
          b === null
            ? bad(new Error('This is too big to save as one picture. Save the PDF instead.'))
            : ok(b),
        'image/png',
      ),
    );
    const png = withDpi(new Uint8Array(await blob.arrayBuffer()), dpi);
    download(new Blob([png.slice().buffer], { type: 'image/png' }), name);
  }

  /** Make it sharper: the picture enlarged and saved, nothing printed. */
  async function saveSharper(): Promise<void> {
    if (one === null || busy !== null) return;
    setSay(null);
    const stop = new AbortController();
    try {
      const canvas =
        one.sharper?.factor === sharperBy
          ? one.sharper.canvas
          : await enlarging(one, sharperBy, stop);
      if (canvas === null)
        return setSay({
          text: 'This device couldn’t make the picture sharper. Try it on a computer.',
          bad: true,
        });
      const name = fileName(`${one.pic.name}-sharper.png`);
      await savePicture(canvas, DPI, name);
      setSay({
        text: `Saved ${name}. It now prints sharp up to ${fmtSize(canvas.width / DPI, unit)} × ${fmtSize(canvas.height / DPI, unit)} ${unit}.`,
        bad: false,
      });
    } catch (err) {
      failed(err, 'The picture couldn’t be made.');
    } finally {
      setBusy(null);
    }
  }

  // What the hang tag says.
  const where =
    paper === 'print'
      ? `on ${sheets === 1 ? 'one page' : `${sheets} pages`} the size of the print`
      : `on ${sheets} ${sheets === 1 ? 'sheet' : 'sheets'} of ${PAPER_NAMES[paper ?? 'letter']}`;
  const verdict = (d: Design): 'sharp' | 'sharper' | 'soft' => {
    const j = jobOf(d);
    const f = enlargeFactor(d.ready.width, d.ready.height, j, d.frame);
    const dpi = sourceDpi(d.ready.width, d.ready.height, j, d.frame);
    if (f === 1) return dpi >= DPI - 0.5 ? 'sharp' : 'soft';
    return dpi * f >= DPI - 0.5 ? 'sharper' : 'soft';
  };
  const curVerdict = cur === null || tab === 'sharper' ? null : verdict(cur);
  const anySoft = designs.some((d) => verdict(d) === 'soft');
  const copies = designs.reduce((n, d) => n + d.copies, 0);
  const printing = tab !== 'sharper';

  // Paper to a product: this design's share of the sheets, for one piece.
  const sheetCents = (() => {
    const d = parseDollars(sheetPrice);
    return d.ok && d.cents !== null && d.cents > 0 ? d.cents : null;
  })();
  const paperEach = (() => {
    if (cur === null || sheetCents === null || cur.copies === 0) return null;
    const area = (d: Design): number => jobOf(d).w * jobOf(d).h * d.copies;
    const total = designs.reduce((n, d) => n + area(d), 0);
    const mine = designs.find((d) => d.key === cur.key) ?? cur;
    return total === 0
      ? null
      : Math.round((sheets * sheetCents * (area(mine) / total)) / mine.copies);
  })();

  const shown =
    cur === null ? null : (typed ?? { w: fmtSize(cur.w, unit), h: fmtSize(cur.h, unit) });
  const about = TABS.find((t) => t.key === tab)?.about ?? '';
  const framing =
    tab === 'piece' && cur !== null && Math.abs(ratioOf(cur) - jobOf(cur).w / jobOf(cur).h) > 0.005;
  const fitsSharper = (f: number): boolean =>
    one !== null && one.ready.width * one.ready.height * f * f <= MAX_AREA;

  // The designs listed on Several on a sheet, and on Fit a piece when there's more than one.
  const list = tab === 'several' ? many : tab === 'piece' ? pieceSet : null;
  const listActive = tab === 'piece' ? pieceActive : active;
  const setList = tab === 'piece' ? setPieceSet : setMany;
  const setListActive = tab === 'piece' ? setPieceActive : setActive;
  const listed = list !== null && (tab === 'several' ? list.length > 0 : list.length > 1);

  const addAnother = (
    <label className="bk-btn bk-btn-quiet bk-btn-small bk-print-add">
      <input
        type="file"
        className="bk-print-file"
        accept="image/*,application/pdf"
        aria-label="Add another design"
        onChange={(e) => {
          void addPicture(e.target.files?.[0], true);
          e.target.value = '';
        }}
      />
      Add another design
    </label>
  );

  // The parts each tab is built from.
  const picturePart = (
    <section className="bk-section">
      <h3 className="bk-section-title">{listed ? 'Your designs' : 'Your design'}</h3>
      {!listed ? (
        <>
          <label className="bk-print-drop" data-has={cur === null ? undefined : 'true'}>
            <input
              type="file"
              className="bk-print-file"
              accept="image/*,application/pdf"
              aria-label="Add your design"
              onChange={(e) => {
                void addPicture(e.target.files?.[0], false);
                e.target.value = '';
              }}
            />
            <span className="bk-print-drop-name">
              {cur === null ? 'Add your design' : cur.pic.name}
            </span>
            <span className="bk-note">
              {cur === null
                ? 'A JPG, PNG or PDF. Tap to choose it, drag it here, or paste it.'
                : `${cur.ready.width} × ${cur.ready.height} pixels · tap to change`}
            </span>
          </label>
          {tab === 'piece' && cur !== null && (
            <>
              {addAnother}
              <p className="bk-note">
                For a set with different designs, like four coasters that don’t match. Each one goes
                on the same piece.
              </p>
            </>
          )}
        </>
      ) : (
        <>
          <ul className="bk-print-pics">
            {(list ?? []).map((d, i) => (
              <li key={d.key} className="bk-print-pic">
                <button
                  type="button"
                  className="bk-print-chip"
                  aria-pressed={i === listActive}
                  onClick={() => {
                    setTyped(null);
                    setListActive(i);
                  }}
                >
                  {d.pic.name}
                </button>
                <span className="bk-note">{sizeLabel(d)}</span>
                {tab === 'several' && (
                  <label className="bk-print-copies">
                    Copies
                    <input
                      className="bk-tool-num"
                      type="number"
                      min={1}
                      max={COPIES_MAX}
                      value={d.copies}
                      onChange={(e) =>
                        setList((all) =>
                          all.map((x) =>
                            x.key === d.key
                              ? {
                                  ...x,
                                  copies: Math.min(
                                    COPIES_MAX,
                                    Math.max(1, Math.round(Number(e.target.value) || 1)),
                                  ),
                                }
                              : x,
                          ),
                        )
                      }
                    />
                  </label>
                )}
                {(list ?? []).length > 1 && (
                  <button
                    type="button"
                    className="bk-link bk-print-link"
                    onClick={() => {
                      setList((all) => all.filter((x) => x.key !== d.key));
                      setListActive(0);
                    }}
                  >
                    {`Remove ${d.pic.name}`}
                  </button>
                )}
              </li>
            ))}
          </ul>
          {addAnother}
          <p className="bk-note">
            {tab === 'piece'
              ? 'Tap a design to choose which part of it shows. They all share the piece below.'
              : 'Tap a design to change its size below.'}
          </p>
        </>
      )}
      {cur !== null && cur.pic.pages > 1 && (
        <div className="bk-field">
          <label className="bk-label" htmlFor="print-page">
            Page of the PDF
          </label>
          <select
            id="print-page"
            className="bk-input"
            value={cur.pic.page}
            onChange={(e) => void choosePage(Number(e.target.value))}
          >
            {Array.from({ length: cur.pic.pages }, (_, i) => (
              <option key={i + 1} value={i + 1}>{`Page ${i + 1}`}</option>
            ))}
          </select>
        </div>
      )}
      {cur !== null && (
        <label className="bk-check bk-print-trim">
          <input type="checkbox" checked={cur.trim} onChange={(e) => setTrim(e.target.checked)} />
          Trim the white border, so the size is the design itself
        </label>
      )}
    </section>
  );

  const unitPart = (
    <div className="bk-print-unit" role="group" aria-label="Measure in">
      <button
        type="button"
        className="bk-print-unit-btn"
        aria-pressed={unit === 'in'}
        onClick={() => setUnit('in')}
      >
        in
      </button>
      <button
        type="button"
        className="bk-print-unit-btn"
        aria-pressed={unit === 'cm'}
        onClick={() => setUnit('cm')}
      >
        cm
      </button>
    </div>
  );

  const sizeField = (which: 'w' | 'h', label: string): React.ReactElement => (
    <div className="bk-field bk-tool-field">
      <label className="bk-label" htmlFor={`print-${which}`}>
        {label}
      </label>
      <span className="bk-tool-inp">
        <input
          id={`print-${which}`}
          className="bk-tool-num"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          disabled={cur === null}
          value={shown?.[which] ?? ''}
          onChange={(e) => setSize(which, e.target.value)}
          onBlur={() => setTyped(null)}
        />
        <span className="bk-tool-unit">{unit}</span>
      </span>
    </div>
  );

  const sizePart = (
    <section className="bk-section">
      <div className="bk-print-head">
        <h3 className="bk-section-title">
          {tab === 'several' && cur !== null ? `Size of ${cur.pic.name}` : 'Size'}
        </h3>
        {unitPart}
      </div>
      <div className="bk-print-size">
        {sizeField('w', 'Width')}
        {sizeField('h', 'Height')}
      </div>
      <p className="bk-note">Type one and the other follows, so the design keeps its shape.</p>
      {cur !== null && (
        <button type="button" className="bk-link bk-print-link" onClick={biggest}>
          Biggest sharp size
        </button>
      )}
    </section>
  );

  const piecePart = (
    <section className="bk-section">
      <div className="bk-print-head">
        <h3 className="bk-section-title">The piece</h3>
        {unitPart}
      </div>
      {canSavePieces && (
        <div className="bk-print-pieces bk-print-pieces-top">
          <p className="bk-label">My pieces</p>
          {pieces.length === 0 && (
            <p className="bk-note">
              Save a piece you cover again and again, and it waits here next time.
            </p>
          )}
          {!editingPieces && (
            <div className="bk-print-chips">
              {pieces.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="bk-print-chip"
                  disabled={cur === null}
                  onClick={() => pickPiece(p)}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
          {editingPieces && (
            <ul className="bk-print-piece-list">
              {pieces.map((p) => (
                <PieceRow
                  key={p.id}
                  piece={p}
                  unit={unit}
                  onRename={(n) => void rename(p, n)}
                  onRemove={() => void remove(p)}
                />
              ))}
            </ul>
          )}
          {pieces.length > 0 && naming === null && (
            <button
              type="button"
              className="bk-link bk-print-link"
              onClick={() => setEditingPieces(!editingPieces)}
            >
              {editingPieces ? 'Done' : 'Change my pieces'}
            </button>
          )}
        </div>
      )}
      <p className="bk-label">Shape</p>
      <div className="bk-print-unit" role="group" aria-label="Shape of the piece">
        {(['rect', 'round', 'oval'] as const).map((s) => (
          <button
            key={s}
            type="button"
            className="bk-print-unit-btn"
            disabled={cur === null}
            aria-pressed={(cur?.shape ?? 'rect') === s}
            onClick={() => setShape(s)}
          >
            {SHAPE_NAMES[s]}
          </button>
        ))}
      </div>
      <div className="bk-print-size">
        {sizeField('w', cur?.shape === 'round' ? 'Across' : 'Width')}
        {cur?.shape !== 'round' && sizeField('h', 'Height')}
      </div>
      <div className="bk-field bk-tool-field">
        <label className="bk-label" htmlFor="print-wrap">
          Wrap over the edge
        </label>
        <span className="bk-tool-inp">
          <WrapInput
            key={`${cur?.key ?? 0}-${unit}-${cur?.wrapIn ?? 0}`}
            id="print-wrap"
            unit={unit}
            disabled={cur === null}
            value={cur?.wrapIn ?? 0}
            onChange={(v) => change({ wrapIn: v })}
          />
          <span className="bk-tool-unit">{unit}</span>
        </span>
        <span className="bk-note">
          Extra on every side to fold over the edge. Leave it blank for a design that stops at the
          edge. Round and oval pieces get their cut line printed.
        </span>
      </div>
      <div className="bk-field bk-tool-field">
        <label className="bk-label" htmlFor="print-copies">
          How many
        </label>
        <span className="bk-tool-inp">
          <input
            id="print-copies"
            className="bk-tool-num"
            type="number"
            min={1}
            max={COPIES_MAX}
            disabled={cur === null}
            value={cur?.copies ?? 1}
            onChange={(e) =>
              change({
                copies: Math.min(COPIES_MAX, Math.max(1, Math.round(Number(e.target.value) || 1))),
              })
            }
          />
        </span>
        <span className="bk-note">
          For a set, like four coasters. They’re fitted on as few sheets as possible.
        </span>
      </div>
      <div className="bk-print-piece-actions">
        {canSavePieces && cur !== null && naming === null && !editingPieces && (
          <button
            type="button"
            className="bk-btn bk-btn-quiet bk-btn-small"
            onClick={() => setNaming('')}
          >
            Save this piece
          </button>
        )}
      </div>
      {naming !== null && (
        <div className="bk-print-name">
          <label className="bk-label" htmlFor="print-piece-name">
            Name this piece
          </label>
          <input
            id="print-piece-name"
            className="bk-input"
            type="text"
            autoComplete="off"
            maxLength={60}
            value={naming}
            onChange={(e) => setNaming(e.target.value)}
          />
          <div className="bk-print-piece-actions">
            <button
              type="button"
              className="bk-btn bk-btn-small"
              onClick={() => void keepSize(naming)}
            >
              Save
            </button>
            <button type="button" className="bk-link bk-print-link" onClick={() => setNaming(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );

  const framePart =
    framing && cur !== null ? (
      <section className="bk-section">
        <h3 className="bk-section-title">
          {pieceSet.length > 1 ? `Which part of ${cur.pic.name} shows` : 'Which part shows'}
        </h3>
        <p className="bk-note bk-print-lead">
          Your design is a different shape from the piece, so some of it won’t fit. Drag it to
          choose which part shows, or zoom out to fit all of it.
        </p>
        <FrameEditor
          src={brightPreviews.get(cur.key) ?? cur.preview}
          job={jobOf(cur)}
          shape={cur.shape}
          frame={cur.frame}
          extend={cur.extend}
          onChange={(f) => change({ frame: f })}
        />
        {cur.frame.zoom < 1 - 1e-6 && (
          <label className="bk-check bk-print-extend">
            <input
              type="checkbox"
              checked={cur.extend}
              onChange={(e) => change({ extend: e.target.checked })}
            />
            <span>
              Extend the design to fill the space
              <span className="bk-note bk-print-why">
                The space around it is filled by mirroring the design’s edges outward, right here on
                your device. It works best on backgrounds; anything right at the edge shows as a
                repeat.
              </span>
            </span>
          </label>
        )}
      </section>
    ) : null;

  const paperPart = (
    <section className="bk-section">
      <h3 className="bk-section-title">Paper and printing</h3>
      {paper !== null && !changingPaper ? (
        <p className="bk-print-paper">
          <span>{`On ${PAPER_NAMES[paper]}`}</span>
          <button
            type="button"
            className="bk-link bk-print-link"
            onClick={() => setChangingPaper(true)}
          >
            Change
          </button>
        </p>
      ) : (
        <div className="bk-field">
          <label className="bk-label" htmlFor="print-paper">
            What paper do you print on?
          </label>
          <select
            id="print-paper"
            className="bk-input"
            value={paper ?? ''}
            onChange={(e) => choosePaper(e.target.value as PaperKey)}
          >
            {paper === null && <option value="">Choose your paper</option>}
            {PAPER_KEYS.map((k) => (
              <option key={k} value={k}>
                {PAPER_NAMES[k]}
              </option>
            ))}
          </select>
          <span className="bk-note">
            Asked once, then remembered on this device. Pick “One page the size of the print” to
            send it to a print shop.
          </span>
        </div>
      )}
      <div className="bk-checks bk-print-options">
        <label className="bk-check">
          <input type="checkbox" checked={mirror} onChange={(e) => setMirror(e.target.checked)} />
          <span>
            Mirror it
            <span className="bk-note bk-print-why">
              For transfers that go on face-down, so the design comes out the right way round.
            </span>
          </span>
        </label>
        <label className="bk-check">
          <input
            type="checkbox"
            checked={brighter}
            onChange={(e) => setBrighter(e.target.checked)}
          />
          <span>
            Brighter for thin paper
            <span className="bk-note bk-print-why">
              Rice paper and tissue print paler; this lifts the colour so the design doesn’t wash
              out.
            </span>
          </span>
        </label>
      </div>
    </section>
  );

  const savePart = (
    <div className="bk-print-save">
      {tab === 'sharper' ? (
        <>
          <div className="bk-print-unit" role="group" aria-label="How much bigger">
            <button
              type="button"
              className="bk-print-unit-btn"
              aria-pressed={sharperBy === 2}
              disabled={!fitsSharper(2)}
              onClick={() => setSharperBy(2)}
            >
              Twice as big
            </button>
            <button
              type="button"
              className="bk-print-unit-btn"
              aria-pressed={sharperBy === 4}
              disabled={!fitsSharper(4)}
              onClick={() => setSharperBy(4)}
            >
              Four times as big
            </button>
          </div>
          <button
            type="button"
            className="bk-btn bk-print-go"
            disabled={one === null || busy !== null || !fitsSharper(sharperBy)}
            onClick={() => void saveSharper()}
          >
            Make it sharper and save
          </button>
          {one !== null && !fitsSharper(2) && (
            <p className="bk-note">This file is already as big as this device can handle.</p>
          )}
        </>
      ) : (
        <>
          <button
            type="button"
            className="bk-btn bk-print-go"
            disabled={cur === null || busy !== null}
            onClick={() => void savePdf()}
          >
            Save the PDF
          </button>
          {tab === 'resize' && (
            <button
              type="button"
              className="bk-link bk-print-link"
              disabled={cur === null || busy !== null}
              onClick={() => void savePng()}
            >
              Save as a picture (PNG) instead
            </button>
          )}
        </>
      )}
      {busy !== null && (
        <div className="bk-print-busy" role="status">
          <p className="bk-note">{busy.say}</p>
          {busy.progress !== null && (
            <progress className="bk-print-progress" max={1} value={busy.progress}>
              {`${Math.round(busy.progress * 100)}%`}
            </progress>
          )}
          {busy.stop !== null && (
            <button
              type="button"
              className="bk-btn bk-btn-quiet bk-btn-small"
              onClick={() => busy.stop?.abort()}
            >
              Stop
            </button>
          )}
        </div>
      )}
      {say !== null && (
        <p
          className={say.bad ? 'bk-print-say bk-error' : 'bk-print-say'}
          role={say.bad ? 'alert' : 'status'}
        >
          {say.text}
        </p>
      )}
    </div>
  );

  const productPart =
    printing && products !== null && products.length > 0 ? (
      <section className="bk-section">
        <h3 className="bk-section-title">Add the paper to a product</h3>
        <p className="bk-note bk-print-lead">
          See what the paper adds to the cost of what you make, then add it in Cost to make.
        </p>
        <div className="bk-tool-grid">
          <div className="bk-field bk-tool-field">
            <label className="bk-label" htmlFor="print-sheet-price">
              One sheet of your paper costs
            </label>
            <span className="bk-tool-inp">
              <span className="bk-tool-unit">$</span>
              <input
                id="print-sheet-price"
                className="bk-tool-num"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={sheetPrice}
                onChange={(e) => setSheetPrice(e.target.value)}
              />
            </span>
          </div>
          <div className="bk-field">
            <label className="bk-label" htmlFor="print-product">
              Product
            </label>
            <select
              id="print-product"
              className="bk-input"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {paperEach !== null && productId !== '' ? (
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
    ) : null;

  const parts: Record<PrintTab, React.ReactNode> = {
    resize: (
      <>
        {picturePart}
        {sizePart}
        {paperPart}
      </>
    ),
    piece: (
      <>
        {picturePart}
        {piecePart}
        {framePart}
        {paperPart}
      </>
    ),
    several: (
      <>
        {picturePart}
        {cur !== null && sizePart}
        {paperPart}
      </>
    ),
    big: (
      <>
        {picturePart}
        {sizePart}
        {paperPart}
      </>
    ),
    sharper: picturePart,
  };

  const tagTitle =
    tab === 'sharper'
      ? 'Make it sharper'
      : cur === null
        ? 'Your print'
        : tab === 'several' || copies > 1
          ? `${copies} ${copies === 1 ? 'print' : 'prints'}`
          : sizeLabel(cur);

  return (
    <section aria-labelledby="tool-print" className="bk-print">
      <h2 id="tool-print" className="bk-tool-title">
        Print your designs at the exact size you need
      </h2>
      <p className="bk-tool-lede">
        Print it gets your designs onto paper at the exact size you need, sharp, ready to cut and
        use. If a file is too small to print sharp, it’s made sharper for you. It all happens on
        your own device, so your designs aren’t uploaded anywhere. Pick what you want to do.
      </p>

      <div className="bk-print-tabs" role="tablist" aria-label="What do you want to do?">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`print-tab-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls="print-panel"
            className="bk-print-tab"
            onClick={() => chooseTab(t.key)}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div
        id="print-panel"
        role="tabpanel"
        aria-labelledby={`print-tab-${tab}`}
        className="bk-print-panel"
      >
        <p className="bk-print-about">{about}</p>
        <div className="bk-tool-main">
          <form className="bk-tool-form" onSubmit={(e) => e.preventDefault()}>
            {parts[tab]}
            {savePart}
            {productPart}
          </form>

          <div className="bk-tool-side bk-print-side">
            <HangTag label="Print it" title={tagTitle}>
              {tab === 'sharper' ? (
                one === null ? (
                  <p className="bk-hangtag-say">
                    Add your design to see how big it can print sharp.
                  </p>
                ) : (
                  <>
                    <p className="bk-hangtag-say">{`Prints sharp up to ${fmtSize(one.ready.width / DPI, unit)} × ${fmtSize(one.ready.height / DPI, unit)} ${unit} now.`}</p>
                    {fitsSharper(sharperBy) && (
                      <p className="bk-hangtag-say">{`Made ${sharperBy === 2 ? 'twice' : 'four times'} as big: up to ${fmtSize((one.ready.width * sharperBy) / DPI, unit)} × ${fmtSize((one.ready.height * sharperBy) / DPI, unit)} ${unit}.`}</p>
                    )}
                  </>
                )
              ) : cur === null ? (
                <p className="bk-hangtag-say">Add your design to see how it prints.</p>
              ) : (
                <>
                  <p className="bk-hangtag-say">{where}</p>
                  {tooMany && <p className="bk-hangtag-say bk-error">{tooManySay}</p>}
                  {paper !== 'print' && job.plan.sheets.some(fillsSheet) && (
                    <p className="bk-hangtag-say">
                      Fills the whole sheet. If your printer can print borderless, turn that on; if
                      not, it leaves a thin white edge.
                    </p>
                  )}
                  {tab === 'big' && sheets === 1 && (
                    <p className="bk-hangtag-say">
                      This fits on one sheet, so there’s nothing to join.
                    </p>
                  )}
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
                  {curVerdict === 'soft' && (
                    <p className="bk-hangtag-say">
                      {tab === 'piece'
                        ? 'Zoom out a little, or use a bigger file.'
                        : 'Try Biggest sharp size, or a bigger file.'}
                    </p>
                  )}
                  {designs.length > 1 && anySoft && curVerdict !== 'soft' && (
                    <p className="bk-hangtag-say">
                      One of the other designs prints a little soft at its size.
                    </p>
                  )}
                </>
              )}
            </HangTag>
            {printing && cur !== null && sheets > 0 && (
              <>
                <MatPreview
                  prints={matPrints}
                  sheets={job.plan.sheets}
                  unit={unit}
                  label={`How it lays out: ${where}`}
                />
                <p className="bk-note bk-print-key">
                  {sheets > 1
                    ? 'The grid is your cutting mat, in ' +
                      (unit === 'cm' ? 'centimetres' : 'inches') +
                      '. Numbers are the order to print and lay the sheets; gold lines are where sheets meet, and the shading is the overlap.'
                    : 'The grid is your cutting mat, in ' +
                      (unit === 'cm' ? 'centimetres' : 'inches') +
                      '. White is your paper.'}
                </p>
              </>
            )}
            {printing && (
              <section className="bk-print-tips" aria-labelledby="print-tips">
                <h3 id="print-tips" className="bk-print-tips-title">
                  {tab === 'big'
                    ? 'Printing and joining the sheets'
                    : 'Printing so the size comes out right'}
                </h3>
                <ul>
                  {tab === 'big' && (
                    <li>
                      Print the sheets in number order. Trim each one along the gold ticks, then lay
                      it over the shaded overlap on the next and glue it down.
                    </li>
                  )}
                  <li>In the print window choose Actual size or 100%. Turn off Fit to page.</li>
                  <li>
                    Measure the ruler bar after printing. If it isn’t exactly 1 in (or 2 cm), the
                    printer changed the size.
                  </li>
                  <li>
                    Thin or special paper, like rice paper or tissue: tape it to a sheet of copy
                    paper along the leading edge before it goes through the printer.
                  </li>
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** The wrap, typed in the maker's unit. */
function WrapInput({
  id,
  unit,
  value,
  disabled,
  onChange,
}: {
  id: string;
  unit: Unit;
  value: number;
  disabled: boolean;
  onChange: (inches: number) => void;
}): React.ReactElement {
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

function PieceRow({
  piece,
  unit,
  onRename,
  onRemove,
}: {
  piece: PrintPiece;
  unit: Unit;
  onRename: (name: string) => void;
  onRemove: () => void;
}): React.ReactElement {
  const [name, setName] = useState(piece.name);
  const id = `print-piece-${piece.id}`;
  return (
    <li className="bk-print-piece-row">
      <label className="bk-sr" htmlFor={id}>{`Name of ${piece.name}`}</label>
      <input
        id={id}
        className="bk-input"
        type="text"
        maxLength={60}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <span className="bk-note">{`${fmtSize(piece.widthIn, unit)} × ${fmtSize(piece.heightIn, unit)} ${unit}${piece.shape === 'rect' ? '' : `, ${SHAPE_NAMES[piece.shape].toLowerCase()}`}`}</span>
      <button
        type="button"
        className="bk-btn bk-btn-quiet bk-btn-small"
        disabled={name.trim() === piece.name}
        onClick={() => onRename(name)}
      >
        Save name
      </button>
      <button type="button" className="bk-btn bk-btn-danger bk-btn-small" onClick={onRemove}>
        {`Remove ${piece.name}`}
      </button>
    </li>
  );
}
