import { writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { dirname } from 'node:path';

const BASE = 'https://d8j0ntlcm91z4.cloudfront.net/user_38zE6IRCqEvAbRQc2Z00szuFsL9';
const OUT = 'C:/Projects/BohdiAI/public/storefronts';

const IMAGES = {
  // Sourdough
  'country.png': 'hf_20260518_145937_95dfa374-f341-429d-a17e-eda4bd77f644.png',
  'seeded.png': 'hf_20260518_150840_bd3caeee-f411-43bf-ad17-c8f138e579d5.png',
  'cinnamon.png': 'hf_20260518_150845_5b092730-ee84-4432-8502-1573f7bcece0.png',
  // Tattoo
  'tattoo-1.png': 'hf_20260518_154607_182dd597-4fd9-4297-900b-2c4a7ccb0d3a.png',
  'tattoo-2.png': 'hf_20260518_154610_d3ba53b4-7c1b-46bb-86bf-0b43be17bac6.png',
  'tattoo-3.png': 'hf_20260518_154636_3b5f4d07-38cb-480a-bb02-a79ca9a551e2.png',
  'tattoo-4.png': 'hf_20260518_154639_dc540b99-a649-4c74-be2a-5049f0fe17d1.png',
  'tattoo-5.png': 'hf_20260518_155801_741e6582-a3e3-4113-9d50-17f72396987e.png',
  'tattoo-6.png': 'hf_20260518_155804_c9973468-a3e5-467c-a606-2a7d308697df.png',
  'tattoo-7.png': 'hf_20260518_155808_4c059476-49dd-440b-afb2-a9cef035894a.png',
  // Kids book
  'fox-cover.png': 'hf_20260518_154642_43ae12d6-81cb-428a-b1bf-c268d65c943b.png',
};

await mkdir(OUT, { recursive: true });

for (const [name, file] of Object.entries(IMAGES)) {
  const url = `${BASE}/${file}`;
  console.log(`Downloading ${name}…`);
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`  FAILED ${res.status}`);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  // Compress: max 800px wide WebP at quality 82
  const out = await sharp(buf)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 })
    .toBuffer();
  const webpName = name.replace(/\.png$/, '.webp');
  await writeFile(`${OUT}/${webpName}`, out);
  console.log(`  ${webpName}: ${(out.length / 1024).toFixed(1)}KB`);
}

console.log('Done.');
