/** `warning`: it saved, but something that rides along with it (a product's costs) didn't. */
export type SaveResult = { ok: true; id: string; warning?: 'costs' | 'takings' } | { ok: false; error: string };
export type PhotoResult =
  | { ok: true; uploadId: string; url: string }
  | { ok: false; error: string };
export type FileResult =
  | { ok: true; uploadId: string; fileName: string }
  | { ok: false; error: string };
export type DoneResult = { ok: true } | { ok: false; error: string };
