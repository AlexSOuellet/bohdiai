import { describe, it, expect } from 'vitest';
import { keyWords } from '@/lib/site-words/words';
import { composeIntakeEmail } from './email';
import { INTAKE_WORD_SPOTS, INTAKE_WORDS_PREFIX } from './words';
import type { IntakeFields } from './request';

const words = keyWords(INTAKE_WORD_SPOTS, INTAKE_WORDS_PREFIX);
const fields: IntakeFields = { makerName: 'Lena', businessName: 'Salt & <Lace>', email: 'lena@example.com', makes: 'Lace', about: 'Line one\nLine two', family: 'luxury' };
const photo = new File([new Uint8Array(1)], 'a.jpg', { type: 'image/jpeg' });

describe('composeIntakeEmail', () => {
  it('lists everything they sent, in the form’s words', () => {
    const e = composeIntakeEmail({
      id: 'abc',
      fields,
      hasPortrait: true,
      words,
      pieces: [
        { name: 'Tide pool', priceCents: 4000, description: 'Blue glass', photo },
        { name: 'Shell', priceCents: 1250, description: null, photo },
        { name: 'Net', priceCents: null, description: null, photo },
      ],
    });
    expect(e.subject).toBe('intake.email.subject');
    expect(e.text).toContain('intake.email.name: Lena');
    expect(e.text).toContain('intake.email.mood: intake.families.luxury.label');
    expect(e.text).toContain('intake.email.portrait: intake.email.portraitYes');
    expect(e.text).toContain('- Tide pool ($40): Blue glass');
    expect(e.text).toContain('- Shell ($12.50)');
    expect(e.text).toContain('- Net (intake.email.priceAsk)');
    expect(e.text).toContain('Line one\nLine two');
    expect(e.html).toContain('Salt &amp; &lt;Lace&gt;');
    expect(e.html).toContain('Line one<br>Line two');
    expect(e.html).toContain('<li>Tide pool ($40): Blue glass</li>');
    expect(e.html).toContain('<li>Net (intake.email.priceAsk)</li>');
  });

  it('fills the blanks', () => {
    const real = { ...words, email: { ...words.email, subject: 'New site request: {business}', photos: 'Saved under intake {id}.' } };
    const e = composeIntakeEmail({ id: 'abc', fields: { ...fields, family: null }, hasPortrait: false, words: real, pieces: [] });
    expect(e.subject).toBe('New site request: Salt & <Lace>');
    expect(e.text).toContain('Saved under intake abc.');
    expect(e.text).toContain('intake.email.mood: intake.mood.pick.label');
    expect(e.text).toContain('intake.email.portrait: intake.email.portraitNo');
  });
});
