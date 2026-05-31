import { z } from 'zod';

const HexColorSchema = z.string().regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, {
  message: 'palette value must be a hex color (#rgb, #rrggbb, or #rrggbbaa)',
});

export const PaletteEntrySchema = z
  .object({
    name: z.string().min(1).max(60),
    value: HexColorSchema,
    character: z.string().min(1).max(400),
  })
  .strict();
export type PaletteEntry = z.infer<typeof PaletteEntrySchema>;

const FontSourceSchema = z.enum(['google', 'system', 'custom']);
export type FontSource = z.infer<typeof FontSourceSchema>;

const FontStyleSchema = z.enum(['normal', 'italic']);
export type FontStyle = z.infer<typeof FontStyleSchema>;

const FontWeightSchema = z
  .number()
  .int()
  .min(100)
  .max(900)
  .refine((n) => n % 100 === 0, { message: 'font weight must be a multiple of 100' });

export const FontEntrySchema = z
  .object({
    name: z.string().min(1).max(80),
    family: z.string().min(1).max(120),
    source: FontSourceSchema,
    weights: z.array(FontWeightSchema).min(1).max(8),
    styles: z.array(FontStyleSchema).min(1).max(2).optional(),
    fallback: z.enum(['sans-serif', 'serif', 'monospace', 'cursive', 'system-ui']),
    character: z.string().min(1).max(400),
    customUrl: z.string().url().optional(),
  })
  .strict()
  .refine((f) => f.source !== 'custom' || f.customUrl !== undefined, {
    message: 'custom font source requires customUrl',
  });
export type FontEntry = z.infer<typeof FontEntrySchema>;

export const TextureEntrySchema = z
  .object({
    name: z.string().min(1).max(60),
    value: z.string().min(1).max(500),
    character: z.string().min(1).max(400),
  })
  .strict();
export type TextureEntry = z.infer<typeof TextureEntrySchema>;

export const StyleSheetSchema = z
  .object({
    palette: z.array(PaletteEntrySchema).min(3).max(24),
    fonts: z.array(FontEntrySchema).min(2).max(16),
    textures: z.array(TextureEntrySchema).max(12),
  })
  .strict()
  .superRefine((sheet, ctx) => {
    const seenPalette = new Set<string>();
    sheet.palette.forEach((p, i) => {
      const slug = slugifyEntry(p.name);
      if (seenPalette.has(slug)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['palette', i, 'name'],
          message: `palette name "${p.name}" collides with another entry (same slug "${slug}")`,
        });
      }
      seenPalette.add(slug);
    });
    const seenFonts = new Set<string>();
    sheet.fonts.forEach((f, i) => {
      const slug = slugifyEntry(f.name);
      if (seenFonts.has(slug)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['fonts', i, 'name'],
          message: `font name "${f.name}" collides with another entry (same slug "${slug}")`,
        });
      }
      seenFonts.add(slug);
    });
    const seenTextures = new Set<string>();
    sheet.textures.forEach((t, i) => {
      const slug = slugifyEntry(t.name);
      if (seenTextures.has(slug)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['textures', i, 'name'],
          message: `texture name "${t.name}" collides with another entry (same slug "${slug}")`,
        });
      }
      seenTextures.add(slug);
    });
  });
export type StyleSheet = z.infer<typeof StyleSheetSchema>;

export function slugifyEntry(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
