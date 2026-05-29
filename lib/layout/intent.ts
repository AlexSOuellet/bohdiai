import { z } from 'zod';

export const DensitySchema = z.enum(['compact', 'normal', 'generous']);
export type Density = z.infer<typeof DensitySchema>;

export const IntentSchema = z
  .object({
    palette: z.string().min(1).optional(),
    type: z.string().min(1).optional(),
    texture: z.string().min(1).optional(),
    density: DensitySchema.optional(),
  })
  .strict();

export type Intent = z.infer<typeof IntentSchema>;
