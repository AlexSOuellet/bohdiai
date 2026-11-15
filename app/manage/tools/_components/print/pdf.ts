/** Building the print-ready PDF on the maker's device: one page per sheet at the
 *  paper's exact size, each print's part at 300 DPI, corner marks, overlap ticks,
 *  and the footer with its ruler bar. */
import { DPI, GAP_IN, MARGIN_IN, type Sheet, type Unit, type Job } from '@/lib/tools/print/layout';
import { cornerMarks, footerLine, overlapTicks, rulerBar, type Line } from '@/lib/tools/print/marks';
import { drawRegion, type Cut, type Look } from './draw';

export type PrintDesign = { src: HTMLCanvasElement; job: Job; look: Look; cut: Cut };

const tick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

export async function buildPdf(designs: readonly PrintDesign[], sheets: readonly Sheet[], unit: Unit, sizeLabel: string, onSheet: (i: number, n: number) => void): Promise<{ blob: Blob; dpi: number }> {
  const { jsPDF } = await import('jspdf');
  let doc: InstanceType<typeof jsPDF> | null = null;
  // The lowest DPI any part was drawn at (lowered for a very big part).
  let lowest = DPI;
  for (const [i, sheet] of sheets.entries()) {
    onSheet(i, sheets.length);
    await tick();
    const orientation = sheet.pw > sheet.ph ? 'l' : 'p';
    if (doc === null) doc = new jsPDF({ unit: 'in', format: [sheet.pw, sheet.ph], orientation, compress: true });
    else doc.addPage([sheet.pw, sheet.ph], orientation);
    const draw = (lines: readonly Line[]): void => {
      for (const l of lines) doc?.line(l.x1, l.y1, l.x2, l.y2);
    };
    const shared = sheet.items.length > 1;
    for (const it of sheet.items) {
      const d = designs[it.design];
      if (d === undefined) continue;
      const { canvas, dpi } = drawRegion(d.src, d.job, it, DPI, d.look, d.cut);
      lowest = Math.min(lowest, dpi);
      doc.addImage(canvas.toDataURL('image/jpeg', 0.93), 'JPEG', it.px, it.py, it.w, it.h, undefined, 'FAST');
      canvas.width = 1;
      canvas.height = 1;
      if (sheet.pw === 0 || (it.px === 0 && it.py === 0 && it.w === sheet.pw)) continue;
      doc.setDrawColor(90);
      doc.setLineWidth(0.006);
      if (d.cut.shape === 'rect') {
        const room = shared ? GAP_IN / 2 : Math.min(it.px, it.py, sheet.pw - it.px - it.w, sheet.ph - it.py - it.h, MARGIN_IN * 4);
        draw(cornerMarks(it, room));
      }
      doc.setDrawColor(168, 80, 106);
      draw(overlapTicks(it));
    }
    const foot = footerLine(sheet, i, sheets.length, sizeLabel);
    if (foot !== null) {
      doc.setFontSize(6);
      doc.setTextColor(110);
      doc.text(foot.text, 0.3, foot.y, { baseline: 'middle' });
      const bar = rulerBar(sheet.pw, unit);
      doc.setDrawColor(60);
      doc.setLineWidth(0.008);
      doc.line(bar.x1, foot.y, bar.x2, foot.y);
      doc.line(bar.x1, foot.y - 0.035, bar.x1, foot.y + 0.035);
      doc.line(bar.x2, foot.y - 0.035, bar.x2, foot.y + 0.035);
      doc.text(bar.label, bar.x1 - 0.06, foot.y, { align: 'right', baseline: 'middle' });
    }
  }
  if (doc === null) throw new Error('There’s nothing to print yet.');
  return { blob: doc.output('blob'), dpi: lowest };
}
