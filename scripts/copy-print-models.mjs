// Print it's enlarger models (Session 122): copies UpscalerJS's ESRGAN medium and
// slim 2x model files (MIT) into public/print-models/, so the maker's device loads
// them from BohdiAI itself, never from a public download site. Run again after
// upgrading @upscalerjs/esrgan-medium or @upscalerjs/esrgan-slim:
//   node scripts/copy-print-models.mjs
import { cpSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
for (const model of ['medium', 'slim']) {
  const from = path.join(root, 'node_modules', '@upscalerjs', `esrgan-${model}`, 'models', 'x2');
  const to = path.join(root, 'public', 'print-models', model);
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
  console.log(`copied esrgan-${model} x2 → public/print-models/${model}`);
}
