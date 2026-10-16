/**
 * The intake form's spots (bohdiai.com/start). Nothing is written into the code:
 * every word the form, its messages and its email to Alex show lives in
 * `intake_words`, one row per spot. This names the spots; every leaf is blank.
 */
import type { WordShape } from '@/lib/site-words/words';

export const INTAKE_WORDS_PREFIX = 'intake';

const MOOD = { label: '', line: '' } as const;

export const INTAKE_WORD_SPOTS = {
  page: { title: '', lede: '', metaTitle: '', metaDescription: '' },
  you: { heading: '', name: '', business: '', email: '' },
  makes: { heading: '', hint: '' },
  pieces: {
    heading: '',
    hint: '',
    add: '',
    remove: '',
    name: '',
    price: '',
    priceHint: '',
    about: '',
    optional: '',
    /** "{n} of {min}" while there are too few. */
    needed: '',
    /** "{n} pieces" once there are enough. */
    enough: '',
    /** Shown when the most are in. */
    full: '',
    /** "Photo of {name}". */
    photoAlt: '',
    reading: '',
  },
  about: { heading: '', hint: '' },
  portrait: { heading: '', hint: '', add: '', change: '', remove: '', alt: '' },
  mood: {
    heading: '',
    hint: '',
    cozy: MOOD,
    rustic: MOOD,
    dark: MOOD,
    elegant: MOOD,
    cheerful: MOOD,
    modern: MOOD,
    pick: MOOD,
  },
  send: { button: '', sending: '' },
  sent: { title: '', body: '' },
  errors: {
    name: '',
    business: '',
    email: '',
    makes: '',
    about: '',
    /** "{min}" in it. */
    piecesFew: '',
    /** "{max}" in it. */
    piecesMany: '',
    /** "{n}": the piece's place on the form. */
    pieceName: '',
    piecePrice: '',
    piecePhoto: '',
    photoType: '',
    photoBig: '',
    photoUnread: '',
    tooLong: '',
    mood: '',
    /** "{email}": Alex's address, so nobody is lost to a bad send. */
    failed: '',
  },
  email: {
    /** "{business}". */
    subject: '',
    intro: '',
    name: '',
    business: '',
    email: '',
    makes: '',
    about: '',
    mood: '',
    portrait: '',
    portraitYes: '',
    portraitNo: '',
    pieces: '',
    priceAsk: '',
    /** "{id}": where the photos are kept. */
    photos: '',
  },
} as const satisfies WordShape;

export type IntakeWordSpots = typeof INTAKE_WORD_SPOTS;
