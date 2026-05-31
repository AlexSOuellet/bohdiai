import { describe, it, expect } from 'vitest';
import { loadLegalMarkdown, renderLegalHtml } from './legal';

const CTX = {
  shopName: 'Flame Works',
  contactEmail: 'hello@flameworks.com',
  lastUpdated: '2026-05-27',
};

describe('loadLegalMarkdown', () => {
  it('interpolates shopName into the terms template', async () => {
    const md = await loadLegalMarkdown('terms', CTX);
    expect(md).toContain('Flame Works');
    expect(md).not.toContain('{{shopName}}');
  });

  it('interpolates contactEmail into the privacy template', async () => {
    const md = await loadLegalMarkdown('privacy', CTX);
    expect(md).toContain('hello@flameworks.com');
    expect(md).not.toContain('{{contactEmail}}');
  });

  it('interpolates lastUpdated', async () => {
    const md = await loadLegalMarkdown('terms', CTX);
    expect(md).toContain('2026-05-27');
    expect(md).not.toContain('{{lastUpdated}}');
  });

  it('escapes HTML special chars in shopName to prevent injection', async () => {
    const md = await loadLegalMarkdown('terms', { ...CTX, shopName: '<script>x</script>' });
    expect(md).not.toContain('<script>');
    expect(md).toContain('&lt;script&gt;');
  });
});

describe('renderLegalHtml', () => {
  it('renders h1', () => {
    expect(renderLegalHtml('# Title')).toBe('<h1>Title</h1>');
  });

  it('renders h2', () => {
    expect(renderLegalHtml('## Section')).toBe('<h2>Section</h2>');
  });

  it('renders a paragraph', () => {
    expect(renderLegalHtml('Hello world.')).toBe('<p>Hello world.</p>');
  });

  it('joins consecutive lines into one paragraph', () => {
    expect(renderLegalHtml('Hello\nworld.')).toBe('<p>Hello world.</p>');
  });

  it('breaks paragraphs on blank lines', () => {
    expect(renderLegalHtml('One.\n\nTwo.')).toBe('<p>One.</p>\n<p>Two.</p>');
  });

  it('renders bold', () => {
    expect(renderLegalHtml('**bold** text')).toBe('<p><strong>bold</strong> text</p>');
  });

  it('renders italic', () => {
    expect(renderLegalHtml('text _italic_ here')).toBe('<p>text <em>italic</em> here</p>');
  });

  it('renders an http link with target=_blank', () => {
    const html = renderLegalHtml('See [BohdiAI](https://bohdiai.com).');
    expect(html).toContain(
      '<a href="https://bohdiai.com" target="_blank" rel="noopener noreferrer">BohdiAI</a>',
    );
  });

  it('renders a mailto link without target=_blank', () => {
    const html = renderLegalHtml('Email [us](mailto:hi@x.com).');
    expect(html).toContain('<a href="mailto:hi@x.com">us</a>');
    expect(html).not.toContain('target="_blank"');
  });

  it('rejects javascript: links (regex requires http or mailto)', () => {
    const html = renderLegalHtml('[click](javascript:alert(1))');
    expect(html).not.toContain('<a');
    expect(html).toContain('[click](javascript:alert(1))');
  });

  it('renders a multi-section document', () => {
    const md = '# Title\n\n## Section\n\nA paragraph.\n\nAnother.';
    const html = renderLegalHtml(md);
    expect(html).toBe('<h1>Title</h1>\n<h2>Section</h2>\n<p>A paragraph.</p>\n<p>Another.</p>');
  });
});
