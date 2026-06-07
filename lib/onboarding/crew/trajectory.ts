/**
 * The Trajectory — the Director's output and the one creative North Star the
 * whole crew executes to (D40). It is small, structured, validated DATA: you can
 * read it on its own and tell whether a bad build came from the wrong vision
 * (the trajectory) or a specialist who failed to execute a right one.
 */
import { z } from 'zod';

export const TrajectorySchema = z.object({
  /** The emotional North Star — one evocative line, not a label. */
  feeling: z.string().min(12).max(160),
  /** Why a customer chooses this maker's category over store-bought. */
  customerWhy: z.string().min(20).max(280),
  /** The look direction in plain terms: warm-craft vs clean-modern vs bold, the
   *  light key (high-key bright / low-key moody), the contrast level. */
  visualWorld: z.string().min(20).max(280),
  /** The cinematic idea for the hero: subject, the motion worth filming, the grade. */
  momentConcept: z.string().min(20).max(360),
  /** Whether the typography should shout or whisper for this feeling. */
  register: z.enum(['loud', 'restrained']),
});

export type Trajectory = z.infer<typeof TrajectorySchema>;
