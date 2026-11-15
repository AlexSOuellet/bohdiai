# Print it — design (2026-11-15, Session 122)

The print resizer Alex had claude.ai build (claude.ai artifact LEK27NNaGJ1NJCaUo3c4xj) becomes a backend tool: simple on its face, BohdiAI's own look, with the extras tucked away.

## Why

Makers who print pictures for their work (decoupage first: rice paper, tissue, napkin-style prints; also transfers, collage, cards, anything that needs a picture printed at an exact size) mostly want one thing: **this picture, this size, sharp.** A bought file is often too small to print sharp at the size they need, and a big piece needs several sheets. Alex's own decoupage experiment is the first user.

## Decided (Alex)

- Every plan gets it, Free included (2026-11-15).
- Wording fits decoupage and any other craft that needs a picture sized for print (2026-11-15).
- It looks like BohdiAI's backend, not a separate app (2026-11-15).
- **Too many choices in the first version: most people want their picture resized to a size and printed at 300 DPI (2026-11-15).** So the screen is three steps and the tool makes every other call itself; the extras sit under one More link, closed by default ("yes.. perfect").
- The `print_pieces` table (below) is approved (2026-11-15).

## The page is built around the job (Alex, 2026-11-15, after trying it)

**Supersedes "The screen" and "More" below.** Alex: one long form with no explanation "leaves it up to the user to figure out what they are doing". The page opens with what the tool is for, then **tabs for what the maker wants to accomplish**; each tab says what it's for and shows only that job's options. **Not a question-and-answer format.** Built for every job, not one scenario (the coaster was an example).

The tabs: **Resize** (one design at an exact size, in proportion; also save as a PNG), **Fit a piece** (a measured piece: shape, size, wrap, how many, saved pieces), **Several on a sheet** (designs and copies, each its own size, fewest sheets), **Big print** (split across overlapping sheets, how to join them), **Make it sharper** (a bigger, sharper picture, nothing printed). Paper, Mirror it and Brighter for thin paper (each with a line on when to use it), the cutting mat with a key, the printing tips and Add the paper to a product sit on every printing tab. A picture added on one tab carries to the others.

**Which part shows:** whenever the design's shape differs from the print's (Fit a piece), the maker drags the picture to choose which part shows, and zooms out as far as the whole picture or in closer. The PDF, the PNG and the mat all print what the maker chose.

**Later the same day (Alex):** ⅛ in at the sides, top and between prints (four 4 in coasters on one Letter sheet), a strip kept at the bottom for the sheet number and ruler; round and oval pieces show and print round; a design made for the sheet (an A4 file on A4) prints on one sheet edge to edge, not split; Fit a piece takes several different designs on the same piece, each with its own "which part shows"; and a zoomed-out design can be **extended** to fill the space, by mirroring its edges outward on the device (no AI: AI extension would mean uploading designs and generating image content, left as its own decision).

## Goals, non-goals, anti-goals

Goal: add a picture, type a size (or pick a saved piece), save a PDF that prints at exactly that size and sharp.

Non-goals: image editing (drawing, text, filters); a printing service; storing the maker's pictures on our servers; image generation (the maker's own files only).

Anti-goals: a screen full of settings; anything that uploads the maker's bought designs (licensed files stay on their device); a print that comes out the wrong size.

## The screen

```
Print it
Print any picture at the exact size you need, sharp.

[ Add your picture ]   (tap, drag it in, or paste)
  your-design.jpg · 1500 × 1500 px            PDF with pages: [Page 2 ▾]

Size      Width [ 8    ]  Height [ 8    ]   in | cm
          My pieces: [ Round tray ] [ Box lid ] [ + Save this size ]
          Biggest sharp size

Paper     US Letter · change

[ Save the PDF ]

More ▸

                         cutting-mat preview              hang tag:
                                                          "8 × 8 in on 1 sheet of US Letter"
                                                          "Sharp" / "Made sharper for you"
```

1. **Add your picture.** JPG, PNG or PDF; tap, drag in or paste. A PDF with more than one page shows a page picker (only then).
2. **Size.** Width and height, always in proportion. Inches or cm (a small switch, remembered on the device). The maker's saved pieces show as buttons under the size; pressing one sets the size. "Save this size" names and keeps the current size. "Biggest sharp size" sets the largest the file prints sharp.
3. **Paper.** Asked the first time (US Letter, US Legal, Tabloid, A4, A3, or "One page the size of the print" for a print shop), then remembered on the device and shown as one line with "change".
4. **Save the PDF.**

### What the tool decides itself

- **Always 300 DPI.**
- **Enlarges on its own.** If the file is too small to be sharp at the size, the tool enlarges it with AI on the maker's device when they save, with a progress bar and a Stop button, and the hang tag says "Made sharper for you". If even enlarging can't reach 300 DPI (the device's image limit), it saves the sharpest it can and says so plainly.
- **Fewest sheets**, turning the paper whichever way needs fewer. A print bigger than the paper is split across sheets with a ¼ in (6 mm) overlap.
- **Trim marks and the 1 in / 2 cm ruler bar always on**, with "print at 100% / Actual size" on each sheet.
- **Proportions always locked.** When a saved piece's shape doesn't match the picture's, the picture fills the piece and the extra is trimmed off evenly (the preview shows exactly what's kept).

### More (closed by default)

- **Mirror the picture**, for transfers that go face-down.
- **Brighter for thin paper**: lifts the colour and deepens the lines so prints don't wash out on rice paper or tissue.
- **Wrap around the edge** and **round or oval pieces**: the shape of the piece and how much wraps over its edge; the print grows by the wrap on every side; round and oval pieces get their cut line printed. Saved pieces keep their shape and wrap.
- **Several pictures on one sheet**: add more pictures or copies, each with its own size; the tool fits them on as few sheets as it can, with cut lines around each.
- **Trim the white border** off a picture so the size is the art itself.
- **Save as a picture (PNG)** instead of a PDF, with its print size written into the file.
- **Add the paper to a product**: type what one sheet costs, pick a product, and Cost to make opens on it with a "Paper" line filled in for each piece. The maker checks it and saves it there, through Cost to make's own rules.

### Printing tips

Under the preview, short and always the same: print at Actual size / 100%, measure the ruler bar, how to lay overlapped sheets, tape thin paper to a carrier sheet before feeding it.

## Dropped from the claude.ai tool (Alex: too many choices)

Quality picker, orientation picker, overlap picker, trim marks switch, crop / fit / stretch picker, the proportions lock, the enlarger's speed choice and its separate Enlarge button and Undo (enlarging now happens on save, and the maker's file is never changed), the quick-size chips (saved pieces replace them), and the sample pattern it opened with.

## Database (approved)

One new table, `print_pieces`: the pieces a maker covers again and again. Each row: the site it belongs to, its name, its shape (rectangle, round or oval), width, height and wrap (kept in inches, shown in the maker's unit), its place in the list, and when it changed. Only the site's own owner reads or changes its rows, the same rule as the other tool tables. Nothing else changes; the product link uses Cost to make's existing lines.

## Where it goes

Tools, a new tab after Describe it, named **Print it** (Claude's call, matching Price it and Describe it). On every plan.

## Look (Claude's calls)

The backend's own pieces (`backend.css`): the cool ground, ink blue, ember gold, Schibsted Grotesk, the fields and sections every tool uses, and the kraft hang tag for the answer, as every other tool shows its answer.

The one bold thing: the preview is a **cutting mat**. The sheets lie on a deep ink-blue self-healing mat with its grid in the maker's unit, so the size reads straight off it. Cut lines and a piece's edge are ember gold; overlap strips a soft ember wash; sheets are numbered only when there's more than one (the order to print and lay them).

## Under the hood (Claude's calls)

- A client screen at `app/manage/tools/print/`, with the sizing, sheet and packing maths in `lib/tools/print/` as plain functions with unit tests.
- jsPDF and pdf.js as installed packages; the enlarger is UpscalerJS with its ESRGAN medium model (slim if medium fails on the device), all MIT, on TensorFlow.js, loaded only when an enlarge is needed. The model files are served from BohdiAI itself, so the screen makes no outside requests.
- Everything runs on the maker's device. The only things sent to our server are saved pieces and the product hand-off.
- Big images are capped to what phones can handle.
- With several pictures: each keeps its own file, size, piece, mirror and trim; the paper and Brighter for thin paper apply to the whole job. The paper line for a product is the sheets used times the sheet price, divided by the pieces covered, split by area when different pictures share sheets.
- Tests: the maths, the screen, saved pieces' actions, the hand-off into Cost to make, the Tools tab on every plan, the database rule.

## Left to the builder

The packing method for several pictures (shelf packing; fewest sheets wins), the colour lift's amounts (judged by eye), and the arrangement on phones.
