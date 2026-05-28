/**
 * Render a Stitch-style design-system infographic for a single niche + mood.
 * Discussion prop — shows how a niche file guides token generation and block
 * assembly for a tenant's home page.
 *
 * Usage: tsx scripts/render-niche-infographic.mts <niche-slug> <mood-key>
 *   e.g. tsx scripts/render-niche-infographic.mts leatherworker dark
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

// Load .env.local into process.env so generateTokens can find BOHDIAI_ANTHROPIC_KEY
const envRaw = fs.readFileSync(path.join(repoRoot, '.env.local'), 'utf8');
for (const line of envRaw.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]!]) process.env[m[1]!] = m[2]!.trim();
}

const { generateTokens } = await import('../lib/generation/generate-tokens.ts');
const { generatePage } = await import('../lib/generation/generate-page.ts');
const { MOODS } = await import('../lib/moods.ts');

const nicheSlug = process.argv[2] ?? 'leatherworker';
const moodKey = process.argv[3] ?? 'dark';

const mood = (MOODS as any)[moodKey];
if (!mood) throw new Error(`Unknown mood: ${moodKey}. Options: ${Object.keys(MOODS).join(', ')}`);

const nichePath = path.join(repoRoot, 'content', 'niches', `${nicheSlug}.md`);
const nicheRaw = fs.readFileSync(nichePath, 'utf8');
// Strip frontmatter
const body = nicheRaw.replace(/^---[\s\S]*?---\s*/m, '');
const displayName = (nicheRaw.match(/display_name:\s*['"]?(.+?)['"]?\s*$/m)?.[1] ?? nicheSlug);

console.log(`Generating tokens + page for ${displayName} × ${mood.label}...`);

const [tokens, page] = await Promise.all([
  generateTokens(body, mood),
  generatePage(`Sample ${displayName} Shop`, displayName, body, mood),
]);

console.log('Tokens:', JSON.stringify(tokens.colors, null, 2));
console.log('Blocks:', page.blocks.map((b: any) => b.blockKey).join(' → '));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shades(hex: string): string[] {
  // Generate 10 shades from very dark to very light
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const out: string[] = [];
  for (let i = 0; i < 10; i++) {
    // i=0 darkest, i=9 lightest
    const t = (i - 4) / 5; // -0.8 .. 1.0
    const mix = (c: number) => {
      if (t < 0) return Math.round(c * (1 + t));
      return Math.round(c + (255 - c) * t);
    };
    const rr = mix(r).toString(16).padStart(2, '0');
    const gg = mix(g).toString(16).padStart(2, '0');
    const bb = mix(b).toString(16).padStart(2, '0');
    out.push(`#${rr}${gg}${bb}`);
  }
  return out;
}

const fontImport = (() => {
  const fonts = new Set([tokens.typography.headingFont, tokens.typography.bodyFont]);
  const families = [...fonts]
    .map((f) => f.replace(/['"]/g, '').split(',')[0]!.trim())
    .filter((f) => !/^(sans-serif|serif|monospace|system-ui)$/i.test(f))
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;600;700;800`);
  if (families.length === 0) return '';
  return `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${families.join('&')}&display=swap">`;
})();

function swatch(label: string, hex: string) {
  const sh = shades(hex);
  return `
    <div class="swatch" style="background:${hex}">
      <div class="swatch-head">
        <span class="swatch-label">${label}</span>
        <span class="swatch-hex">${hex.toUpperCase()}</span>
      </div>
      <div class="swatch-shades">
        ${sh.map((s) => `<div style="background:${s}"></div>`).join('')}
      </div>
    </div>
  `;
}

const heading = tokens.typography.headingFont;
const bodyF = tokens.typography.bodyFont;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${displayName} × ${mood.label} — Design System</title>
${fontImport}
<style>
  :root {
    --primary: ${tokens.colors.primary};
    --accent: ${tokens.colors.accent};
    --bg: ${tokens.colors.background};
    --surface: ${tokens.colors.surface};
    --text: ${tokens.colors.text};
    --muted: ${tokens.colors.textMuted};
    --border: ${tokens.colors.border};
    --heading: ${heading};
    --body: ${bodyF};
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 48px;
    background: #f4f0ea;
    font-family: var(--body), system-ui, sans-serif;
    color: #1a1a1a;
    background-image:
      radial-gradient(circle, #d6d0c4 1px, transparent 1px);
    background-size: 24px 24px;
  }
  .meta {
    text-align: center;
    margin-bottom: 24px;
    color: #555;
    font-size: 14px;
  }
  .meta h1 { margin: 0 0 4px; font-family: var(--heading), serif; font-size: 28px; color: #111; }
  .meta .sub { opacity: 0.7; }
  .stage {
    max-width: 1400px;
    margin: 0 auto;
    background: #e8e2d6;
    border: 2px solid #6a72d6;
    border-radius: 24px;
    padding: 32px;
  }
  .stage-label { font-size: 13px; color: #666; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 16px;
  }
  .col { display: flex; flex-direction: column; gap: 16px; }
  .swatch {
    border-radius: 16px;
    padding: 16px;
    color: white;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    min-height: 200px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .swatch-head { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; }
  .swatch-shades { display: flex; gap: 0; height: 32px; border-radius: 6px; overflow: hidden; }
  .swatch-shades > div { flex: 1; }
  .panel {
    background: var(--bg);
    border-radius: 16px;
    padding: 20px;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: var(--text);
  }
  .panel-head { display: flex; justify-content: space-between; font-size: 12px; color: var(--muted); }
  .panel-head .font-name { font-style: italic; }
  .panel .sample { font-size: 64px; line-height: 1; align-self: center; padding: 16px 0; }
  .panel .sample.serif { font-family: var(--heading), serif; font-weight: ${tokens.typography.headingWeight}; }
  .panel .sample.sans { font-family: var(--body), sans-serif; }
  .btns { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .btn {
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    border: 1px solid transparent;
    text-align: center;
    font-family: var(--body), sans-serif;
  }
  .btn.primary { background: var(--primary); color: white; }
  .btn.secondary { background: var(--surface); color: var(--text); border-color: var(--border); }
  .btn.inverted { background: #2a2421; color: white; }
  .btn.outlined { background: transparent; color: var(--text); border-color: var(--border); }
  .lines > div {
    height: 6px;
    border-radius: 3px;
    margin: 6px 0;
  }
  .lines .l1 { background: var(--primary); width: 90%; }
  .lines .l2 { background: var(--accent); width: 70%; }
  .lines .l3 { background: var(--text); width: 50%; opacity: 0.6; }
  .search {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 14px 16px;
    color: var(--muted);
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--body), sans-serif;
  }
  .navpill {
    background: var(--surface);
    border-radius: 999px;
    padding: 10px 14px;
    display: flex;
    gap: 16px;
    justify-content: space-around;
    align-items: center;
  }
  .navpill .icon {
    width: 36px; height: 36px; border-radius: 999px;
    display: flex; align-items: center; justify-content: center;
    background: var(--primary); color: white; font-size: 16px;
  }
  .navpill .icon.muted { background: transparent; color: var(--text); }
  .iconrow { display: flex; gap: 10px; justify-content: center; align-items: center; }
  .iconrow .ic {
    width: 38px; height: 38px; border-radius: 999px;
    display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;
  }
  .chip {
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 14px;
    background: var(--accent);
    color: white;
    text-align: center;
    font-weight: 600;
  }
  .chip.icon-only { padding: 10px; }
  .blocks-row {
    max-width: 1400px;
    margin: 24px auto 0;
    background: white;
    border-radius: 16px;
    padding: 20px 24px;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }
  .blocks-row .blab { font-size: 12px; color: #777; text-transform: uppercase; letter-spacing: 0.08em; margin-right: 8px; }
  .blocks-row .b {
    padding: 8px 12px;
    background: #f3f0e8;
    border: 1px solid #d8d2c6;
    border-radius: 8px;
    font-size: 13px;
    font-family: ui-monospace, monospace;
    color: #333;
  }
  .blocks-row .arrow { color: #aaa; }
</style>
</head>
<body>
  <div class="meta">
    <h1>${displayName} × ${mood.label}</h1>
    <div class="sub">Generated from <code>content/niches/${nicheSlug}.md</code> · mood: <code>${moodKey}</code></div>
  </div>

  <div class="stage">
    <div class="stage-label">🎨 ${displayName} — ${mood.label}</div>
    <div class="grid">
      <!-- Column 1: palette -->
      <div class="col">
        ${swatch('Primary', tokens.colors.primary)}
        ${swatch('Accent', tokens.colors.accent)}
        ${swatch('Text', tokens.colors.text)}
        ${swatch('Border', tokens.colors.border)}
      </div>

      <!-- Column 2: typography -->
      <div class="col">
        <div class="panel">
          <div class="panel-head"><span>Headline</span><span class="font-name">${heading}</span></div>
          <div class="sample serif">Aa</div>
        </div>
        <div class="panel">
          <div class="panel-head"><span>Body</span><span class="font-name">${bodyF}</span></div>
          <div class="sample sans">Aa</div>
        </div>
        <div class="panel">
          <div class="panel-head"><span>Label</span><span class="font-name">${bodyF}</span></div>
          <div class="sample sans" style="font-size:48px">Aa</div>
        </div>
      </div>

      <!-- Column 3: components -->
      <div class="col">
        <div class="panel">
          <div class="btns">
            <div class="btn primary">Primary</div>
            <div class="btn secondary">Secondary</div>
            <div class="btn inverted">Inverted</div>
            <div class="btn outlined">Outlined</div>
          </div>
        </div>
        <div class="panel">
          <div class="lines">
            <div class="l1"></div>
            <div class="l2"></div>
            <div class="l3"></div>
          </div>
        </div>
        <div class="panel">
          <div class="btns">
            <div class="chip icon-only" style="background:${tokens.colors.accent}">✎</div>
            <div class="chip">✎ Label</div>
          </div>
        </div>
      </div>

      <!-- Column 4: search/nav/icons -->
      <div class="col">
        <div class="panel">
          <div class="search">⌕ &nbsp; Search</div>
        </div>
        <div class="panel">
          <div class="navpill">
            <div class="icon">⌂</div>
            <div class="icon muted">⌕</div>
            <div class="icon muted">☺</div>
          </div>
        </div>
        <div class="panel">
          <div class="iconrow">
            <div class="ic" style="background:${tokens.colors.primary}">✦</div>
            <div class="ic" style="background:${tokens.colors.accent}">▲</div>
            <div class="ic" style="background:${tokens.colors.text}">◆</div>
            <div class="ic" style="background:#c44">🗑</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="blocks-row">
    <span class="blab">Home page blocks</span>
    ${page.blocks
      .sort((a: any, b: any) => a.position - b.position)
      .map((b: any, i: number, arr: any[]) => `<span class="b">${b.blockKey}</span>${i < arr.length - 1 ? '<span class="arrow">→</span>' : ''}`)
      .join('')}
  </div>

  <div class="blocks-row" style="margin-top:12px">
    <span class="blab">Shape</span>
    <span class="b">borderRadius: ${tokens.shape.borderRadius}</span>
    <span class="b">cardRadius: ${tokens.shape.cardBorderRadius}</span>
    <span class="blab" style="margin-left:16px">Spacing</span>
    <span class="b">section: ${tokens.spacing.sectionPadding}</span>
    <span class="b">cardGap: ${tokens.spacing.cardGap}</span>
    <span class="blab" style="margin-left:16px">Layout</span>
    <span class="b">hero: ${tokens.layout.heroStyle}</span>
    <span class="b">cols: ${tokens.layout.productGridCols}</span>
    <span class="b">footer: ${tokens.layout.footerStyle}</span>
  </div>
</body>
</html>`;

const outDir = path.join(repoRoot, 'tmp');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `niche-infographic-${nicheSlug}-${moodKey}.html`);
fs.writeFileSync(outFile, html);
console.log(`\n✓ Wrote ${path.relative(repoRoot, outFile)}`);
