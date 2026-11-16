'use client';

/** Print it's preview: the sheets lying on a cutting mat, its grid in the maker's
 *  unit, so the size reads straight off it. One print across several sheets is shown
 *  put together, with each sheet's edge dashed and the overlap shaded; prints sharing
 *  sheets are shown sheet by sheet. Colours come from the backend's own look. */
import { useEffect, useRef, useState } from 'react';
import type { Job, Sheet, Unit } from '@/lib/tools/print/layout';
import { paintPrint, type Cut, type Look } from './draw';

export type MatPrint = { src: HTMLCanvasElement; job: Job; look: Look; cut: Cut };

const PAD = 0.6;
const SHEET_GAP = 0.6;
const MAX_H = 520;
const COLS = 3;

function vars(el: HTMLElement): { mat: string; ember: string; line: string; heavy: string; ink: string } {
  const s = getComputedStyle(el);
  const v = (n: string, d: string): string => s.getPropertyValue(n).trim() || d;
  return { mat: v('--bk-deep', '#1f2a44'), ember: v('--bk-ember', '#d59a3c'), line: v('--bk-print-grid', 'rgba(255,255,255,0.1)'), heavy: v('--bk-print-grid-heavy', 'rgba(255,255,255,0.22)'), ink: v('--bk-deep', '#1f2a44') };
}

export function MatPreview({ prints, sheets, unit, label }: { prints: readonly MatPrint[]; sheets: readonly Sheet[]; unit: Unit; label: string }): React.ReactElement {
  const box = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = box.current;
    if (el === null) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const cv = ref.current;
    if (cv === null || width === 0 || sheets.length === 0) return;
    const c = vars(cv);
    const together = prints.length === 1 && sheets.length > 1 && sheets.every((s) => s.items.length === 1 && s.items[0]?.design === 0);
    const first = sheets[0];
    if (first === undefined) return;
    const cols = Math.min(COLS, sheets.length);
    const rows = Math.ceil(sheets.length / cols);
    const job = prints[0]?.job;
    const sceneW = together && job !== undefined ? job.w + 2 * PAD : PAD * 2 + cols * first.pw + (cols - 1) * SHEET_GAP;
    const sceneH = together && job !== undefined ? job.h + 2 * PAD : PAD * 2 + rows * first.ph + (rows - 1) * SHEET_GAP;
    const k = Math.min(width / sceneW, MAX_H / sceneH);
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(sceneW * k * dpr);
    cv.height = Math.round(sceneH * k * dpr);
    cv.style.setProperty('--w', `${Math.round(sceneW * k)}px`);
    const x = cv.getContext('2d');
    if (x === null) return;
    x.setTransform(dpr * k, 0, 0, dpr * k, 0, 0);
    const px = 1 / k;

    // The mat and its grid.
    x.fillStyle = c.mat;
    x.fillRect(0, 0, sceneW, sceneH);
    const step = unit === 'cm' ? 1 / 2.54 : 1;
    const heavyEvery = unit === 'cm' ? 5 : 1;
    for (let i = 0, at = 0; at <= sceneW; i++, at = i * step) {
      x.fillStyle = i % heavyEvery === 0 ? c.heavy : c.line;
      x.fillRect(at, 0, px, sceneH);
    }
    for (let i = 0, at = 0; at <= sceneH; i++, at = i * step) {
      x.fillStyle = i % heavyEvery === 0 ? c.heavy : c.line;
      x.fillRect(0, at, sceneW, px);
    }

    const number = (n: number, cx: number, cy: number): void => {
      const r = 11 * px;
      x.beginPath();
      x.arc(cx + r + 6 * px, cy + r + 6 * px, r, 0, Math.PI * 2);
      x.fillStyle = c.ember;
      x.fill();
      x.fillStyle = c.ink;
      x.font = `700 ${12 * px}px system-ui, sans-serif`;
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText(String(n), cx + r + 6 * px, cy + r + 7 * px);
    };

    if (together && job !== undefined) {
      const p = prints[0];
      if (p === undefined) return;
      x.save();
      x.translate(PAD, PAD);
      paintPrint(x, p.src, p.job, p.look, p.cut, 1 / px);
      x.setLineDash([6 * px, 4 * px]);
      x.strokeStyle = c.ember;
      x.lineWidth = 1.5 * px;
      sheets.forEach((s, i) => {
        const t = s.items[0];
        if (t === undefined) return;
        x.strokeRect(t.x0, t.y0, t.w, t.h);
        x.globalAlpha = 0.22;
        x.fillStyle = c.ember;
        if (t.nextX !== null) x.fillRect(t.x0 + t.nextX, t.y0, t.w - t.nextX, t.h);
        if (t.nextY !== null) x.fillRect(t.x0, t.y0 + t.nextY, t.w, t.h - t.nextY);
        x.globalAlpha = 1;
        number(i + 1, t.x0, t.y0);
      });
      x.restore();
      return;
    }

    sheets.forEach((s, i) => {
      const sx = PAD + (i % cols) * (s.pw + SHEET_GAP);
      const sy = PAD + Math.floor(i / cols) * (s.ph + SHEET_GAP);
      x.save();
      x.translate(sx, sy);
      x.shadowColor = 'rgba(0,0,0,0.35)';
      x.shadowBlur = 10;
      x.fillStyle = '#fff';
      x.fillRect(0, 0, s.pw, s.ph);
      x.shadowBlur = 0;
      for (const t of s.items) {
        const p = prints[t.design];
        if (p === undefined) continue;
        x.save();
        x.beginPath();
        x.rect(t.px, t.py, t.w, t.h);
        x.clip();
        x.translate(t.px - t.x0, t.py - t.y0);
        paintPrint(x, p.src, p.job, p.look, p.cut, 1 / px);
        x.restore();
        if (s.items.length > 1) {
          x.setLineDash([5 * px, 4 * px]);
          x.strokeStyle = c.ember;
          x.lineWidth = 1.25 * px;
          x.strokeRect(t.px, t.py, t.w, t.h);
          x.setLineDash([]);
        }
      }
      if (sheets.length > 1) number(i + 1, 0, 0);
      x.restore();
    });
  }, [prints, sheets, unit, width]);

  return (
    <div ref={box} className="bk-print-mat">
      <canvas ref={ref} className="bk-print-canvas" role="img" aria-label={label} />
    </div>
  );
}
