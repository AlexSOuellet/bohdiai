import * as z from 'zod/v4';
import type { AskedQuestion } from './transcript';

/**
 * The shapes the model answers in, shared by the server (to ask for them) and
 * the browser (to check what comes back before showing it).
 */

/** The model's choice of what to ask next. */
export const PickSchema = z.object({
  done: z.boolean(),
  next_id: z.string(),
  bridge: z.string(),
});

export type Pick = z.infer<typeof PickSchema>;

const PathSchema = z.object({
  group: z.enum(['better', 'bigger', 'mindset']),
  title: z.string(),
  body: z.array(z.string()),
  step: z.string(),
});

const HelpSchema = z.object({
  offer: z.enum(['showcase', 'market', 'full_shop']),
  text: z.string(),
});

export const WriteUpSchema = z.object({
  summary: z.array(z.string()),
  first_steps: z.array(z.string()),
  paths: z.array(PathSchema),
  help_intro: z.string(),
  help: z.array(HelpSchema),
});

export type WriteUp = z.infer<typeof WriteUpSchema>;

/** What /api/checkup/next answers. */
export type NextStep = { readonly done: true } | { readonly done: false; readonly question: AskedQuestion };
