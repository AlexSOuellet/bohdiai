# Print it Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Print it tab in Tools that prints the maker's picture at an exact size, sharp at 300 DPI, on the fewest sheets, with the extras under More.

**Architecture:** All image work runs in the maker's browser: pure sizing/sheet/packing maths in `lib/tools/print/` (unit-tested), canvas rendering + jsPDF for the PDF, pdf.js to open PDFs, UpscalerJS (ESRGAN medium, slim fallback) on TensorFlow.js to enlarge, each loaded with a dynamic import only when needed. The server holds only the maker's saved pieces (`print_pieces`) and hands paper costs to Cost to make through the address, as the other tools do.

**Tech Stack:** Next.js 16 App Router, React client component, Supabase (RLS), vitest + Testing Library, Playwright, jspdf, pdfjs-dist, upscaler + @upscalerjs/esrgan-medium + @upscalerjs/esrgan-slim + @tensorflow/tfjs.

**Spec:** `Project-Docs/Print-Tool-Design.md`

## Global Constraints

- Every plan, Free included; Tools tab "Print it", after Describe it.
- Always 300 DPI; overlap ¼ in (0.25 in; shown "6 mm" in cm); page margin 0.25 in; trim marks + ruler (1 in, or 2 cm) always; "print at 100% / Actual size" on each sheet.
- Proportions always locked; a saved piece of another shape → the picture fills it, trimmed evenly.
- Papers: US Letter 8.5×11, US Legal 8.5×14, Tabloid 11×17, A4 8.268×11.693, A3 11.693×16.535 (inches), and "One page the size of the print".
- Image area capped at 16,000,000 px (phones).
- Nothing the maker opens leaves the device; the screen makes no outside requests (model files served from `/print-models/`).
- No inline styles (CSS custom properties via `style.setProperty` in effects, as `Placed` does); classes in `app/manage/backend.css`, prefixed `bk-print-`.
- Wording for any craft, not only decoupage; "the maker", never "she"; no ALL CAPS labels; no numbered markers except sheet numbers.
- Every failure shows the maker a plain message (file unreadable, enlarger can't run, too big, save failed).
- Type-check with `.next` excluded before push; check the `test` check run and Workers Builds after push.

## Review Focus

- A PDF of many pages or a huge photo (e.g. 8000×6000 px): must open within the 16 MP cap, not crash the tab → `loadPicture` test with a mocked oversize image asserts the canvas is scaled to ≤ 16 MP (Task 3).
- A size typed as "0", "", "abc", or "600": must be ignored or capped (max 200 in), never NaN in the hang tag → `parseSize` tests (Task 2).
- An enlarger that fails (no WebGL, out of memory) or is stopped: the PDF still saves from the original, with "printed as sharp as this device allows" → `PrintTool` test with `enlarge` mocked to reject (Task 4).
- A wide picture on a saved round piece: fill + even trim, preview and PDF agree → `placement` test, fill on mismatched aspect (Task 2).
- cm users: the ruler is 2 cm, sizes round to 0.1 cm, saved pieces stored in inches show back the same cm → `fmtSize`/round-trip test (Task 2).

---

### Task 1: Saved pieces (table, reads, actions)

**Files:**
- Create: `supabase/migrations/20261115000001_print_pieces.sql`
- Create: `lib/tools/print/pieces.ts`, `lib/tools/print/pieces.test.ts`
- Create: `lib/tools/print/actions.ts`
- Modify: `lib/database.types.ts` (via `npm run gen:types`)

**Interfaces:**
- Produces: `type PieceShape = 'rect' | 'round' | 'oval'`; `type PrintPiece = { id: string; name: string; shape: PieceShape; widthIn: number; heightIn: number; wrapIn: number }`; `checkPiece(input: { name: string; shape: string; widthIn: number; heightIn: number; wrapIn: number }): { ok: true; piece: Omit<PrintPiece, 'id'> } | { ok: false; error: string }`; `loadPieces(db, tenantId): Promise<PrintPiece[]>` (by position, then name); server actions `savePiece(input): Promise<{ ok: true; piece: PrintPiece } | { ok: false; error: string }>`, `renamePiece(id, name)`, `deletePiece(id)`: `Promise<DoneResult>`.

- [ ] **Step 1: Migration.** Table `print_pieces`: `id uuid pk default gen_random_uuid()`, `tenant_id uuid not null references tenants(id) on delete cascade`, `name text not null check (char_length(name) between 1 and 60)`, `shape text not null default 'rect' check (shape in ('rect','round','oval'))`, `width_in numeric(6,2) not null check (width_in > 0 and width_in <= 200)`, `height_in` same, `wrap_in numeric(4,2) not null default 0 check (wrap_in between 0 and 6)`, `position integer not null default 0`, `updated_at timestamptz not null default now()`; index `(tenant_id, position)`; cap 50 per site enforced in `savePiece`; RLS + updated_at trigger + the four `is_tenant_admin(tenant_id)` policies exactly as `20261024000001_free_plan_tools.sql`; table comment pointing at the design doc. Apply with `node scripts/db-migrate.mjs`, then `npm run gen:types`.
- [ ] **Step 2: Failing tests** in `pieces.test.ts`: `checkPiece` trims the name; rejects blank name ("Give the piece a name."), name over 60, width/height ≤ 0 or > 200, wrap < 0 or > 6, unknown shape; round forces `heightIn = widthIn`. `loadPieces` maps rows (fake Supabase chain as in `lib/market/market-db.test.ts`). Run `npx vitest run lib/tools/print/pieces.test.ts` → FAIL.
- [ ] **Step 3: Implement** `pieces.ts`; `actions.ts` (`'use server'`) follows `lib/tools/actions.ts`: `requireActingSite`, `createSupabaseServerClient`, logger on DB error, plain error to the maker, `revalidatePath('/manage/tools/print')`; 50-piece cap ("You can keep up to 50 pieces."). Tests for the actions with mocked site/db.
- [ ] **Step 4:** run the tests → PASS. `node scripts/check-page-rule.mjs` still passes. Curl a live site (e.g. saltmarsh) → 200.
- [ ] **Step 5: Commit** `feat(print): saved pieces`.

### Task 2: The sizing and sheet maths

**Files:**
- Create: `lib/tools/print/layout.ts`, `lib/tools/print/layout.test.ts`

**Interfaces:**
- Produces: `DPI = 300`, `OVERLAP_IN = 0.25`, `MARGIN_IN = 0.25`, `MAX_AREA = 16e6`, `MAX_IN = 200`; `type Unit = 'in' | 'cm'`; `type PaperKey = 'letter'|'legal'|'tabloid'|'a4'|'a3'|'print'`; `PAPERS: Record<PaperKey, { w: number; h: number }>` (print = 0×0); `parseSize(text: string, unit: Unit): number | null` (inches, capped at 200, null if not > 0); `fmtSize(inches: number, unit: Unit): string` (2 dp in, 1 dp cm, trailing zeros dropped); `type Job = { w: number; h: number }` (inches, wrap included); `withWrap(piece: { w: number; h: number }, wrapIn: number): Job`; `placement(srcW, srcH, job: Job): { x; y; w; h }` (fill, centred); `sourceDpi(srcW, srcH, job): number`; `biggestSharp(srcW, srcH, maxFactor: number): Job` (at 300 DPI after the largest enlarge that fits MAX_AREA); `enlargeFactor(srcW, srcH, job): 1 | 2 | 4` (smallest reaching 300 DPI within MAX_AREA; 4 = two 2× passes; 1 if not needed); `type Sheet = { pw; ph; items: Array<{ design: number; x0; y0; w; h; px; py; nextX: number | null; nextY: number | null }> }`; `planSheets(designs: Job[], paper: PaperKey): { sheets: Sheet[]; landscape: boolean }`.

- [ ] **Step 1: Failing tests:** `parseSize('8','in') === 8`, `parseSize('20.3','cm') ≈ 7.992`, `''/'0'/'abc' → null`, `'600' → 200`; `fmtSize(7.992,'cm') === '20.3'`, `fmtSize(8,'in') === '8'`; one 8×8 on Letter → 1 sheet, centred; 16×20 on Letter → 6 sheets portrait-or-landscape, whichever is fewer (check both); overlap: neighbouring tiles share exactly 0.25 in; `print` paper → one sheet the job's size, no margin; four 3×3 on Letter → 1 sheet (packing); `placement(2000,1000,{w:8,h:8})` → w=16, x=-4; `sourceDpi(1500,1500,{8,8}) === 187.5`; `enlargeFactor(1500,1500,{8,8}) === 2`, `(600,600,{8,8}) === 4`, `(3000,3000,{8,8}) === 1`; `biggestSharp(1500,1500,2) → 10×10`; `withWrap({w:10,h:10},0.75) → 11.5×11.5`.
- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3: Implement.** Single design: the claude.ai tool's `layout()`/`tiles()` (tile count `ceil((x-ov)/(av-ov))`). Several designs: designs that fit a sheet are shelf-packed (sort by height desc, 0.25 in cut gap), trying both orientations, fewest sheets wins; designs bigger than a sheet tile on their own sheets.
- [ ] **Step 4:** run → PASS (and lib coverage ≥ 90% branches).
- [ ] **Step 5: Commit** `feat(print): sizing and sheet maths`.

### Task 3: Opening, drawing and saving (browser side)

**Files:**
- Create: `lib/tools/print/open.ts` (open file/paste/PDF page), `lib/tools/print/draw.ts` (render a sheet region to canvas: fill placement, mirror, brighter, trim white), `lib/tools/print/pdf.ts` (jsPDF build: sheets, marks, overlap ticks, footer + ruler), `lib/tools/print/png.ts` (`withDpi(png: Uint8Array, dpi: number): Uint8Array`, the pHYs chunk), `lib/tools/print/enlarge.ts`, tests beside each.
- Create: `public/print-models/` (the ESRGAN medium and slim x2 model files copied from `node_modules/@upscalerjs/esrgan-*/models/`; a `scripts/copy-print-models.mjs` documents and repeats the copy).
- Modify: `package.json` (add `jspdf`, `pdfjs-dist`, `upscaler`, `@upscalerjs/esrgan-medium`, `@upscalerjs/esrgan-slim`, `@tensorflow/tfjs`).

**Interfaces:**
- Consumes: Task 2's `Job`, `Sheet`, `placement`, `MAX_AREA`, `DPI`.
- Produces: `type Picture = { canvas: HTMLCanvasElement; name: string; pages: number; page: number }`; `openPicture(file: File, page?: number): Promise<Picture>` (throws `Error` with the maker-facing message); `type Look = { mirror: boolean; brighter: boolean; trim: boolean }`; `prepared(pic: HTMLCanvasElement, look: Look): HTMLCanvasElement`; `drawRegion(src, job, region: {x0;y0;w;h}, dpi, look): HTMLCanvasElement`; `buildPdf(designs: Array<{ src: HTMLCanvasElement; job: Job; look: Look }>, plan, unit: Unit, onSheet: (i: number, n: number) => void): Promise<Blob>`; `enlarge(src: HTMLCanvasElement, factor: 2 | 4, onProgress: (f: number) => void, signal: AbortSignal): Promise<HTMLCanvasElement>` (medium model, retries on slim, rejects with a maker-facing message).

- [ ] **Step 1: Failing tests:** `withDpi` writes a pHYs chunk right after IHDR with 11811 px/m for 300 DPI and a correct CRC; `openPicture` rejects a non-image with "That file couldn’t be opened. Try a JPG, PNG or PDF."; an oversize image is scaled to ≤ 16 MP (mocked `Image`/canvas); `buildPdf` (jspdf mocked) makes one page per sheet at the paper's size in inches and places each item at 300 DPI; brighter changes pixel values in the stated direction (jsdom canvas mocked with `vitest-canvas-mock` if the repo has it, else a stub ImageData).
- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3: Implement**, carrying the claude.ai tool's working code (trimWhite, renderRegion, marksFor, footerFor, withDpi) into these files; brighter = gamma 0.85 + saturation ×1.15 + a slight contrast lift, tuned by eye.
- [ ] **Step 4:** run → PASS. `npm run build` is NOT run on the PC; check the bundle by type-check only.
- [ ] **Step 5: Commit** `feat(print): open, draw, enlarge and save`.

### Task 4: The Print it screen

**Files:**
- Create: `app/manage/tools/print/page.tsx` (server: loads `loadPieces`, and the maker's products when products are on), `app/manage/tools/_components/PrintTool.tsx`, `app/manage/tools/_components/MatPreview.tsx`, `app/manage/tools/_components/PrintTool.test.tsx`
- Modify: `lib/backend/modules.ts` (add `{ label: 'Print it', href: '/manage/tools/print' }` after Describe it), its menu test; `app/manage/tools/layout.tsx` comment; `app/manage/backend.css` (`bk-print-*`, the mat).

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: `PrintTool({ pieces: PrintPiece[]; products: Array<{ id: string; name: string }> | null })`.

- [ ] **Step 1: Failing tests:** before a picture, the hang tag says "Add your picture to see how it prints."; after a (mocked) picture of 1500×1500 and width 8 in, the tag reads "8 × 8 in on 1 sheet of US Letter" and "Made sharper for you when you save"; typing width keeps height in proportion; the in/cm switch shows 20.3 × 20.3 cm; a saved piece button sets its size; "Biggest sharp size" sets 10 × 10; paper asked first time and remembered (localStorage mocked, read in try/catch); Save the PDF calls `enlarge` (factor 2) then `buildPdf`, and when `enlarge` rejects it still saves and says "Printed as sharp as this device allows."; Stop aborts the enlarge; More is closed by default; the Tools menu lists Print it after Describe it on every plan including Free.
- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3: Implement.** Layout per the design's sketch: form left, mat + hang tag right (stacks on phones). `MatPreview` draws on a canvas: deep ink-blue mat (`--bk-deep`) with a grid every 1 in (or 1 cm, every 5 cm heavier), white sheets with a soft shadow, the picture placed, ember cut lines (`--bk-ember`), overlap strips at 22% ember, sheet numbers only when > 1. Colours read from CSS variables at draw time. Download with an `<a download>` blob link; file name `<picture>-<w>x<h><unit>.pdf`. Printing tips under the preview.
- [ ] **Step 4:** run → PASS; all of `app/manage/tools` tests pass.
- [ ] **Step 5: Commit** `feat(print): the Print it screen`.

### Task 5: More

**Files:**
- Modify: `PrintTool.tsx`, `PrintTool.test.tsx`, `lib/tools/handoff.ts` + its test (a `paperLink(productId: string, eachCents: number, sheets: number): string`), `app/manage/tools/cost/page.tsx` + `CostTool.tsx` (read `?product=<id>&paper=<cents>&sheets=<n>` and add a piece line "Paper, <n> sheets" with that each, on top of the product's loaded costs; not saved until the maker saves).

**Interfaces:**
- Consumes: Task 2 `planSheets` (several designs), Task 1 `savePiece` (shape + wrap), Task 3 `Look`, `withDpi`.

- [ ] **Step 1: Failing tests:** More opens; Mirror and Brighter for thin paper change the `Look` passed to `buildPdf`; choosing Round with 10 in and wrap ¾ in makes the job 11.5 × 11.5 and the PDF draws a round cut line; Save this size keeps shape and wrap; Add another picture + copies 4 of a 3 × 3 → "on 1 sheet"; Trim the white border; Save as a picture (PNG) downloads a PNG run through `withDpi`; Add the paper to a product with $1.25 a sheet, 3 sheets, 4 pieces opens `/manage/tools/cost?product=<id>&paper=94&sheets=3` (rounded cents of 3×125/4), and Cost to make shows the line "Paper, 3 sheets" at $0.94 added to the product's own lines; with no products the hand-off is hidden.
- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3: Implement.** Paper share by area when different pictures share sheets (spec).
- [ ] **Step 4:** run → PASS; full `npx vitest run`, lint, type-check with `.next` excluded.
- [ ] **Step 5: Commit** `feat(print): More options and the paper hand-off`.

### Task 6: Check and ship

- [ ] Start the dev server in Alex's Terminal panel (ask first if one is running); open `/manage/tools/print` acting as Saltmarsh; open a real JPG and a two-page PDF; save a PDF at 8 × 8 and at 16 × 20 on Letter; open the PDFs and check page size and ruler; check phone width.
- [ ] Hand Alex the local link. After his look: update `Open-Work.md`, `SESSION-BRIEF.md`, the session log; push; check the `test` check run and Workers Builds; merge to `main` once he's happy; delete the branch.
