/**
 * The intake form's spots (bohdiai.com/start). Nothing is written into the code:
 * every word the form, its messages and its email to Alex show lives in
 * `intake_words`, one row per spot. This names the spots; every leaf is blank.
 */
import type { WordShape } from '@/lib/site-words/words';
import { FAMILY_KEYS, type FamilyKey } from '@/lib/archetypes/main-street/families';

export const INTAKE_WORDS_PREFIX = 'intake';

const LOOK = { label: '', line: '' } as const;

/** One tile per family there is, now and later: a new family gets its spots here
 *  the day it's added (Alex, 2026-10-16). Makers see these as moods. */
const FAMILY_SPOTS = Object.fromEntries(FAMILY_KEYS.map((k) => [k, LOOK])) as Record<FamilyKey, typeof LOOK>;

export const INTAKE_WORD_SPOTS = {
  page: { title: '', lede: '', metaTitle: '', metaDescription: '' },
  /** The first step (Alex, Session 119): the plan and the account, then Stripe. */
  signup: {
    title: '',
    lede: '',
    /** Free's price on its plan tile. */
    free: '',
    button: '',
    sending: '',
    /** Shown when Stripe's back button brought them here. */
    back: '',
  },
  /** Back from Stripe. */
  paid: {
    metaTitle: '',
    title: '',
    /** "{email}". */
    body: '',
    spam: '',
    notPaidTitle: '',
    notPaidBody: '',
    notPaidButton: '',
    again: '',
    /** "{email}". */
    sent: '',
    wrong: '',
    fixLabel: '',
    fixButton: '',
    cancel: '',
  },
  /** The email that confirms their address, sent once they've paid. */
  confirm: {
    subject: '',
    /** "{name}". */
    greeting: '',
    body: '',
    button: '',
    /** Who to ignore it as. */
    notYou: '',
    signoff: '',
  },
  plan: {
    heading: '',
    hint: '',
    monthly: '',
    yearly: '',
    /** "{price}". */
    perMonth: '',
    /** "{price}". */
    perYear: '',
  },
  you: {
    heading: '',
    name: '',
    business: '',
    email: '',
    password: '',
    /** "{min}". */
    passwordHint: '',
    show: '',
    hide: '',
  },
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
    pick: LOOK,
  },
  families: FAMILY_SPOTS,
  send: { button: '', sending: '' },
  sent: { title: '', body: '' },
  errors: {
    plan: '',
    /** "{min}" and "{max}". */
    password: '',
    accountExists: '',
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
  /** The email the maker gets when their site is built. */
  ready: {
    /** "{business}". */
    subject: '',
    /** "{name}". */
    greeting: '',
    /** "{business}". */
    body: '',
    /** "{email}": the email they signed up with. */
    signIn: '',
    button: '',
    signoff: '',
  },
  email: {
    /** "{business}". */
    subject: '',
    intro: '',
    plan: '',
    /** "{plan}". */
    planMonthly: '',
    /** "{plan}". */
    planYearly: '',
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
