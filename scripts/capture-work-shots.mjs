// Re-capture the bohdiai.com work screenshots: node scripts/capture-work-shots.mjs [slug] [url]
// Pass a url with the slug to capture a site before it is live (e.g. its local dev address).
// Headless Chrome at 1440x900, cropped to the top 1440x760 (above cookie banners), saved as WebP
// in public/work/. Look at every image afterwards — a blank or half-loaded page must not ship.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const SITES = {
  'cut-pro-lawncare': 'https://cut-pro-lawncare.bohdiai.com',
  decodigitaldesigns: 'https://decodigitaldesigns.com',
  'classic-loafs': 'https://classic-loafs.bohdiai.com',
  'twilight-to-darkness': 'https://twilight-to-darkness.bohdiai.com',
  'heavenly-scents': 'https://heavenly-scents.bohdiai.com',
  'rustic-rhody': 'https://rustic-rhody.bohdiai.com',
};

const CHROME = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
].find((p) => p && existsSync(p));
if (!CHROME) throw new Error('Chrome not found; set CHROME_PATH');

const only = process.argv[2];
const urlOverride = process.argv[3];
if (urlOverride && !only) throw new Error('A url needs a slug in front of it');
if (only && !(only in SITES)) throw new Error(`Unknown site "${only}". Known: ${Object.keys(SITES).join(', ')}`);

const work = mkdtempSync(path.join(tmpdir(), 'shots-'));
try {
  for (const [slug, siteUrl] of Object.entries(SITES)) {
    if (only && only !== slug) continue;
    const url = urlOverride ?? siteUrl;
    const png = path.join(work, `${slug}.png`);
    execFileSync(
      CHROME,
      [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--window-size=1440,900',
        '--virtual-time-budget=8000',
        `--user-data-dir=${path.join(work, 'profile')}`,
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36',
        `--screenshot=${png}`,
        url,
      ],
      { stdio: 'ignore' },
    );
    if (!existsSync(png)) throw new Error(`Chrome produced no screenshot for ${url}`);
    await sharp(png)
      .extract({ left: 0, top: 0, width: 1440, height: 760 })
      .webp({ quality: 80 })
      .toFile(path.join('public', 'work', `${slug}.webp`));
    console.log(`captured ${slug}`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
