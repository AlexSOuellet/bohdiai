import { describe, expect, it } from 'vitest';
import { wordKeys, wordsFrom } from '@/lib/site-words/words';
import { INTAKE_WORD_SPOTS, INTAKE_WORDS_PREFIX } from '@/lib/intake/words';
import type { IntakeWords } from '@/lib/intake/queries';
import { emailSamples } from './email-samples';

describe('emailSamples', () => {
  const words = wordsFrom(INTAKE_WORD_SPOTS, INTAKE_WORDS_PREFIX, new Map(wordKeys(INTAKE_WORD_SPOTS, INTAKE_WORDS_PREFIX).map((k) => [k, k]))) as IntakeWords;
  it('shows every maker email in the shared design, with images from the address given', () => {
    const samples = emailSamples(words, 'http://localhost:3000');
    expect(samples).toHaveLength(13);
    expect(samples.map((s) => s.title)).toEqual(expect.arrayContaining(['Kept their plan', 'Now billed yearly', 'Billed monthly from renewal', 'Moved down at renewal']));
    for (const s of samples) {
      expect(s.subject).not.toBe('');
      expect(s.html).toContain('Alex Ouellet');
      expect(s.html).toContain('http://localhost:3000/email/alex.png');
    }
  });
});
