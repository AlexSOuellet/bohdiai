import { z } from 'zod';

export const waitlistSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(254)
    .email('That doesn’t look like a valid email.'),
  type: z.enum(['founder', 'notify']),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;

export const resendSchema = z.object({
  email: z.string().trim().toLowerCase().email('That doesn’t look like a valid email.'),
});
