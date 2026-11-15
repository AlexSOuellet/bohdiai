'use client';

/** Choosing which part of the picture shows when its shape differs from the print's
 *  (Alex, 2026-11-15). The print's shape is clear; the part of the picture that
 *  won't print is dimmed around it. Drag the picture (or use the arrow keys) to move
 *  it; the slider zooms out as far as the whole picture, or in closer. */
import { useEffect, useRef, useState } from 'react';
import { FILL, MAX_ZOOM, clampZoom, minZoom, nudge, placement, type Frame, type Job } from '@/lib/tools/print/layout';
import type { PieceShape } from '@/lib/tools/print/pieces';
import { paintPrint } from './draw';

const BOX_H = 300;
const ROOM = 0.6;
const KEY_STEP = 0.1;

export function FrameEditor({ src, job, shape, frame, extend = false, onChange }: { src: HTMLCanvasElement; job: Job; shape: PieceShape; frame: Frame; extend?: boolean; onChange: (f: Frame) => void }): React.ReactElement {
  const box = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [width, setWidth] = useState(0);
  const low = minZoom(src.width, src.height, job);
  // Inches to screen pixels: the print takes the middle of the box, with room around it to see what's cut.
  const scale = width === 0 ? 1 : Math.min((width * ROOM) / job.w, (BOX_H * ROOM) / job.h);

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
    if (cv === null || width === 0) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(width * dpr);
    cv.height = Math.round(BOX_H * dpr);
    const x = cv.getContext('2d');
    if (x === null) return;
    const s = getComputedStyle(cv);
    const mat = s.getPropertyValue('--bk-deep').trim() || '#1f2a44';
    const ember = s.getPropertyValue('--bk-ember').trim() || '#d59a3c';
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.fillStyle = mat;
    x.fillRect(0, 0, width, BOX_H);
    const ox = (width - job.w * scale) / 2;
    const oy = (BOX_H - job.h * scale) / 2;
    const p = placement(src.width, src.height, job, frame);
    const outline = (): void => {
      x.beginPath();
      if (shape === 'rect') x.rect(ox, oy, job.w * scale, job.h * scale);
      else x.ellipse(ox + (job.w * scale) / 2, oy + (job.h * scale) / 2, (job.w * scale) / 2, (job.h * scale) / 2, 0, 0, Math.PI * 2);
    };
    // The whole picture, dimmed: the part outside the print won't be printed.
    x.globalAlpha = 0.35;
    x.drawImage(src, ox + p.x * scale, oy + p.y * scale, p.w * scale, p.h * scale);
    x.globalAlpha = 1;
    // The print itself, as it will print: on white paper, clear, extended if asked.
    x.save();
    x.translate(ox, oy);
    x.scale(scale, scale);
    paintPrint(x, src, job, { mirror: false, brighter: false, frame, extend }, { shape, wrapIn: 0 }, scale);
    x.restore();
    x.setLineDash([6, 4]);
    x.strokeStyle = ember;
    x.lineWidth = 2;
    outline();
    x.stroke();
  }, [src, job, shape, frame, extend, width, scale]);

  const move = (dxPx: number, dyPx: number): void => onChange(nudge(frame, dxPx / scale, dyPx / scale, src.width, src.height, job));
  const zoomTo = (z: number): void => onChange({ ...frame, zoom: clampZoom(z, src.width, src.height, job) });

  return (
    <div className="bk-print-frame">
      <div ref={box} className="bk-print-frame-box">
        <canvas
          ref={ref}
          className="bk-print-frame-canvas"
          tabIndex={0}
          role="img"
          aria-label="Drag the picture to choose which part shows. Arrow keys move it too."
          onPointerDown={(e) => {
            drag.current = { x: e.clientX, y: e.clientY };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (d === null) return;
            move(e.clientX - d.x, e.clientY - d.y);
            drag.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
          onKeyDown={(e) => {
            const step = KEY_STEP * scale;
            const by: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
            const d = by[e.key];
            if (d === undefined) return;
            e.preventDefault();
            move(d[0], d[1]);
          }}
        />
      </div>
      <div className="bk-print-zoom">
        <label className="bk-label" htmlFor="print-zoom">
          Zoom
        </label>
        <input id="print-zoom" className="bk-print-zoom-range" type="range" min={low} max={MAX_ZOOM} step={0.01} value={frame.zoom} onChange={(e) => zoomTo(Number(e.target.value))} />
        <div className="bk-print-piece-actions">
          <button type="button" className="bk-link bk-print-link" onClick={() => onChange({ zoom: low, x: 0, y: 0 })}>
            Show the whole picture
          </button>
          <button type="button" className="bk-link bk-print-link" onClick={() => onChange(FILL)}>
            Fill it again
          </button>
        </div>
      </div>
    </div>
  );
}
