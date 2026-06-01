import { z } from 'zod';
import { SURFACE_ROLES } from '@/lib/design-system/types';

export const DensitySchema = z.enum(['compact', 'normal', 'generous']);
export type Density = z.infer<typeof DensitySchema>;

export const IntentSchema = z
  .object({
    palette: z.string().min(1).optional(),
    surface: z.enum(SURFACE_ROLES).optional(),
    type: z.string().min(1).optional(),
    texture: z.string().min(1).optional(),
    density: DensitySchema.optional(),
  })
  .strict();

export type Intent = z.infer<typeof IntentSchema>;
