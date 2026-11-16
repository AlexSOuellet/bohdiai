/**
 * Long words kept as plain text in the database (the maker terms, go-live step 3):
 * paragraphs split by a blank line, a line starting "## " is a heading. Kept plain
 * so the words can be edited without touching the code.
 */
export type TextBlock = { kind: 'heading' | 'paragraph'; text: string };

export function textBlocks(body: string): TextBlock[] {
  const out: TextBlock[] = [];
  for (const chunk of body.replace(/\r\n/g, '\n').split(/\n\s*\n/)) {
    const lines = chunk
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l !== '');
    const para: string[] = [];
    const flush = (): void => {
      if (para.length > 0) out.push({ kind: 'paragraph', text: para.splice(0).join(' ') });
    };
    for (const line of lines) {
      if (line.startsWith('## ')) {
        flush();
        out.push({ kind: 'heading', text: line.slice(3).trim() });
      } else para.push(line);
    }
    flush();
  }
  return out;
}

/** One thing per line, blanks dropped. */
export function textLines(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '');
}
