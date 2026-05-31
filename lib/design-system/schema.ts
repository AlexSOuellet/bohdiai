import { z } from 'zod';
import { TYPE_SCALE_ROLES } from './types';

const HexColorSchema = z.string().regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, {
  message: 'must be a hex color (#rgb, #rrggbb, or #rrggbbaa)',
});

const FontWeightSchema = z
  .number()
  .int()
  .min(100)
  .max(900)
  .refine((n) => n % 100 === 0, { message: 'font weight must be a multiple of 100' });

export const TypeScaleEntrySchema = z
  .object({
    fontName: z.string().min(1).max(80),
    sizePx: z.number().int().min(14).max(200),
    sizeMobilePx: z.number().int().min(14).max(200),
    weight: FontWeightSchema,
    lineHeight: z.number().min(0.5).max(4),
    letterSpacing: z.string().max(20).optional(),
    uppercase: z.boolean().optional(),
  })
  .strict()
  .refine((e) => e.sizeMobilePx <= e.sizePx, {
    message: 'sizeMobilePx must be ≤ sizePx',
    path: ['sizeMobilePx'],
  });
export type TypeScaleEntry = z.infer<typeof TypeScaleEntrySchema>;

export const TypeScaleSchema = z
  .object(
    Object.fromEntries(TYPE_SCALE_ROLES.map((role) => [role, TypeScaleEntrySchema])) as Record<
      (typeof TYPE_SCALE_ROLES)[number],
      typeof TypeScaleEntrySchema
    >,
  )
  .strict();
export type TypeScale = z.infer<typeof TypeScaleSchema>;

export const SemanticColorsSeedSchema = z
  .object({
    primarySeedColor: HexColorSchema,
    scheme: z.enum(['light', 'dark']),
  })
  .strict();
export type SemanticColorsSeed = z.infer<typeof SemanticColorsSeedSchema>;

export const SpacingSchema = z
  .object({
    unit: z.number().int().min(4).max(32),
  })
  .strict();
export type Spacing = z.infer<typeof SpacingSchema>;
