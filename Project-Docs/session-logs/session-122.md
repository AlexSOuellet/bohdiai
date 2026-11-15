# Session 122 (2026-11-15)

**Print it, a new tool, merged and live; Act as a maker lists every maker.**

## Print it (Alex)
Alex's claude.ai decoupage print resizer (artifact LEK27NNaGJ1NJCaUo3c4xj) became a Tools tab, **Print it**, after Describe it, on every plan, Free included. Spec: `Project-Docs/Print-Tool-Design.md`; plan: `Project-Docs/Print-Tool-Plan.md`.

- Decided along the way (Alex): every plan; wording for decoupage and any craft that needs a picture sized for print; too many choices in the first version, so the tool makes the technical calls (always 300 DPI, enlarged with AI on the maker's device when the file is too small, fewest sheets, ¼ in overlap, marks and ruler); then, after trying it: **the page opens with what it's for, then tabs for what the maker wants to accomplish** (Resize, Fit a piece, Several on a sheet, Big print, Make it sharper), not question and answer; built for every job, not one scenario.
- Fit a piece: shape, size, wrap, how many, saved pieces (`print_pieces`, approved), several different designs on one piece, drag and zoom to choose which part shows, **extend** a zoomed-out design by mirroring its edges (on the device, no AI; AI extension would upload designs and generate image content: its own decision, not taken).
- ⅛ in at the sides, top and between prints (four 4 in coasters on one Letter sheet), a strip at the bottom for the sheet number and ruler; round pieces show and print round; a design made for the sheet (an A4 file on A4) prints on one sheet edge to edge.
- No stretch option (Alex): designs always keep their shape; Fit a piece covers other shapes.
- The enlarger is UpscalerJS ESRGAN (MIT) on TensorFlow.js, its model files served from `/print-models/` (`scripts/copy-print-models.mjs`). Nothing the maker opens leaves the device.
- A fresh review found four real problems (sheet count unbounded, PDF under 300 DPI unannounced, no-WebGL grind, silent piece-save failures), all fixed with tests. Deferred minors are in Open-Work item 60.

## Admin
Act as a maker: search, **or see every maker in a list** (Alex; replaces "no screen listing all sites").

## Open
- **Alex asked (end of session): a single public page on bohdiai.com with the tools, to share for feedback, with a feedback / suggestion form and a list of tools being considered.** This meets Alex's standing "there is no public toolkit": ask him first (Open-Work item 61).
- Alex to print a real PDF at Actual size and measure the ruler bar.
- `feat/plan-changes` (Session 121) is still unmerged, untouched this session.
