/**
 * The Trajectory — the Director's output and the one creative North Star the
 * whole crew executes to (D40). It is small, structured, validated DATA: you can
 * read it on its own and tell whether a bad build came from the wrong vision
 * (the trajectory) or a specialist who failed to execute a right one.
 */
import { z } from 'zod';

// The trajectory is internal scaffolding the crew passes around — none of it is
// rendered, so the text fields carry no length cap, only a non-empty floor.
export const TrajectorySchema = z.object({
  /** The emotional North Star — one evocative line, not a label. */
  feeling: z.string().min(1),
  /** Why a customer chooses this maker's category over store-bought. */
  customerWhy: z.string().min(1),
  /** The look and feel the store should have. */
  visualWorld: z.string().min(1),
  /** The cinematic idea for the hero: subject, the motion worth filming, the grade. */
  heroConcept: z.string().min(1),
  /** Whether the typography should shout or whisper for this feeling. */
  register: z.enum(['loud', 'restrained']),
  /** Which kind of hero the director called for. Video when the subject has real
   *  ambient motion (steam, flame, water, hands at work, light moving across a
   *  room). Still when the product is at rest and inventing motion would feel
   *  fake — the hero is then a cinematic SCENE composition (the product in its
   *  world, lit naturally, with depth and air), held still. */
  heroKind: z.enum(['video', 'still']),
});

export type Trajectory = z.infer<typeof TrajectorySchema>;
