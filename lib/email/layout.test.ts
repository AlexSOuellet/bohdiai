import { describe, expect, it } from 'vitest';
import { renderEmail } from './layout';

describe('renderEmail', () => {
  const base = { heading: 'Your site is ready', paragraphs: ['First line.', 'Second line.'] };

  it('shows the heading, the words and who it’s from', () => {
    const html = renderEmail(base);
    expect(html).toContain('>Your site is ready</h1>');
    expect(html).toContain('First line.');
    expect(html).toContain('Second line.');
    expect(html).toContain('Alex Ouellet');
    expect(html).toContain('mailto:alex@bohdiai.com');
  });
  it('previews the first line in the inbox', () => {
    expect(renderEmail(base)).toMatch(/display:none[^>]*>First line\.<\/div>/);
    expect(renderEmail({ heading: 'Only a heading', paragraphs: [] })).toMatch(/display:none[^>]*>Only a heading<\/div>/);
  });
  it('makes a real button, only when there is one', () => {
    expect(renderEmail(base)).not.toContain('border-radius:999px');
    const html = renderEmail({ ...base, button: { label: 'Sign in', url: 'https://x.example/?a=1&b=2' } });
    expect(html).toContain('href="https://x.example/?a=1&amp;b=2"');
    expect(html).toContain('>Sign in</a>');
  });
  it('adds small print', () => {
    expect(renderEmail({ ...base, small: ['This link lasts 24 hours.'] })).toContain('This link lasts 24 hours.');
  });
  it('makes anything typed safe', () => {
    const html = renderEmail({ heading: 'A <b> & "c"', paragraphs: ['<script>'] });
    expect(html).toContain('A &lt;b&gt; &amp; &quot;c&quot;');
    expect(html).not.toContain('<script>');
  });
  it('loads images from the live site unless told otherwise', () => {
    expect(renderEmail(base)).toContain('src="https://bohdiai.com/email/alex.png"');
    expect(renderEmail({ ...base, assetBase: 'http://localhost:3000' })).toContain('src="http://localhost:3000/email/wordmark.png"');
  });
});
