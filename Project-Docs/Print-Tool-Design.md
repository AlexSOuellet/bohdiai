# Print it — design (2026-11-15, Session 122)

The decoupage print resizer Alex had claude.ai build (claude.ai artifact LEK27NNaGJ1NJCaUo3c4xj) becomes a backend tool, with six additions and BohdiAI's own look.

## Why

Makers who print designs onto paper for their work (decoupage first: rice paper, tissue, napkin-style prints; also transfers, collage, card makers, anyone who needs a picture printed at an exact size) fight the same things: a bought file that prints too small or blurry, a big piece that needs several sheets, and expensive paper wasted on one small design per sheet. Alex's own decoupage experiment is the first user. The tools are where makers work things out before they become products (Alex, 2026-10-24).

## Decided (Alex)

- Every plan gets it, Free included (2026-11-15).
- Everything the claude.ai tool does stays (2026-11-15).
- All six additions are in: several designs on one sheet, size it to the piece, tie it to products, adjust for thin paper, remember sizes, largest sharp size (2026-11-15).
- Wording fits decoupage and any other craft that needs a picture sized and adjusted for print (2026-11-15).
- It looks like BohdiAI's backend, not a separate app (2026-11-15).

## Goals, non-goals, anti-goals

Goals: a maker opens their design, says what they're covering, and prints it the right size, sharp, on the fewest sheets.

Non-goals: no image editing beyond what's listed (no drawing, text, filters); no printing service; no storing the maker's design files on our servers; no image generation (the maker's own files only, as for every BohdiAI build).

Anti-goals: anything that uploads the maker's bought designs (licensed files stay on their device); a print that comes out the wrong size; a screen that reads like a separate app bolted on.

## What stays from the claude.ai tool

Open a JPG, PNG or PDF (choose the page), paste, drag in; trim the white border; enlarge with AI on the device (Best detail / Fast, 2× or 4×, stop, undo); inches or cm; keep proportions; quick sizes; crop / fit / stretch; mirror; paper size (Letter, Legal, Tabloid, A4, A3, page = design size); orientation (fewest sheets / portrait / landscape); overlap between sheets; quality (150/200/300 DPI); trim marks and the ruler bar; live preview; sharpness check; save as PDF; save as PNG with its print size written in; the printing tips.

Two changes from moving into the app: saving is a normal browser download (no claude.ai save prompt), and the tool opens empty, asking for the maker's design, instead of drawing a sample pattern.

## The six additions

1. **Several designs on one sheet.** The maker adds more than one design (or more copies of one), each with its own size. The tool lays them out on as few sheets as it can, with a cut gap between them and cut lines around each. Designs bigger than a sheet still tile across sheets as today. Shown on the preview as the real sheets.
2. **Size it to the piece.** The maker picks the shape they're covering (rectangle, round, oval), types its measurements and how much should wrap over the edge. The print size becomes the piece plus the wrap on every side. Round and oval pieces get their cut line printed (a dashed outline), and the preview shows the piece's edge inside the wrap.
3. **Tie it to products.** "Add the paper to a product": the maker types what one sheet of their paper costs, picks one of their products, and Cost to make opens on that product with a new line already filled in ("Paper: 3 sheets", the cost of three sheets). They check it and save it there, through Cost to make's own rules, the same way the other tools hand off. Free has products, so this works on every plan.
4. **Brighter for thin paper.** A switch that lifts the colour and darkens the lines before printing so designs don't wash out on rice paper and tissue. The preview shows the change.
5. **Remember my pieces.** A maker saves a piece (its name, shape, measurements and wrap) and picks it from a list next time. Rename and delete. This is the one new table (below).
6. **Largest sharp size.** One button: sets the size to the biggest the file prints sharp (300 DPI, or the maker's chosen quality), keeping proportions.

## Database (needs Alex's yes before it's made)

One new table, `print_pieces`: the pieces a maker covers again and again. Each row: the site it belongs to, its name, its shape (rectangle, round or oval), width and height and wrap (kept in inches, shown in the maker's unit), its place in the list, and when it changed. Only the site's own owner reads or changes its rows (the same rule as the other tool tables). Nothing else changes; the product link uses Cost to make's existing lines.

## Where it goes

Tools, a new tab after Describe it, named **Print it** (Claude's call, matching Price it and Describe it; Alex can rename it). On every plan.

## Look (Claude's calls)

Built from the backend's own pieces (`backend.css`): the cool ground, ink blue, ember gold, Schibsted Grotesk, the fields and sections every tool uses, and the kraft hang tag for the answer ("8 × 8 in on 1 sheet of US Letter", the sharpness verdict, the sheet count), the way every other tool shows its answer.

The one bold thing: the preview is a **cutting mat**. The sheets lie on a deep ink-blue self-healing mat with its grid printed in the maker's unit (inches or cm), so the size can be read straight off it. Cut lines and the piece's edge are ember gold; overlap strips are a soft ember wash; each sheet is numbered only when there's more than one (they are a real order: the order to print and lay them). Everything else stays quiet.

## Under the hood (Claude's calls)

- A client screen under `app/manage/tools/print/`, with the layout and geometry maths in `lib/tools/print/` as plain functions with unit tests (sheets, tiling, packing several designs, wrap, largest sharp size, DPI).
- jsPDF and pdf.js installed as packages (MIT, Apache-2.0); the enlarger uses the official UpscalerJS ESRGAN slim and medium models (`@upscalerjs/esrgan-slim`, `@upscalerjs/esrgan-medium`, MIT) with TensorFlow.js, loaded only when the maker presses Enlarge, so the screen stays light.
- Everything runs on the maker's device. The only things sent to our server are saved pieces and the product hand-off.
- Big images capped to what phones can handle (as the claude.ai tool does).
- Tests: the maths, the screen (open, size, sheets, save buttons), saved pieces' actions, the hand-off into Cost to make, the menu entry on every plan, the database rule.

## Settled after the builder check (Claude's calls)

- **Each design vs the whole job.** Each design keeps its own file, size, crop / fit / stretch, mirror, trim border, enlarge, the piece it's sized to (shape and wrap) and its copies. The whole job shares the paper, orientation, overlap, quality, trim marks, and Brighter for thin paper (it's about the paper). The sharpness check and Largest sharp size work on the design being edited; the hang tag also warns if any design on the job would print soft.
- **The paper line in Cost to make.** It's a line for each piece ("Paper"), costing the sheets the job uses times the price of a sheet, divided by the pieces the job covers (its copies). When several different designs share sheets, each design's share is by the area it takes up. The maker sees the sum before handing off and can change it in Cost to make.
- **The quick sizes and the printing tips** come over from the claude.ai tool as they are, except the tips are worded for any thin or special paper, not only rice paper.
- **The enlarger's model files are served from BohdiAI itself**, not a public download site (each is under 4 MB, well inside Cloudflare's limit), so the screen makes no outside requests.

## Left to the builder

Exact packing method for several designs (simple shelf packing is enough; fewest sheets wins), the colour lift's exact amounts (judged by eye on a real print), and the screen's arrangement on phones.
