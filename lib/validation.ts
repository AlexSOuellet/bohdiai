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

export const contactSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().trim().min(1, 'Please enter your name.').max(120),
  email: z.string().trim().toLowerCase().email('That doesn’t look like a valid email.').max(254),
  message: z.string().trim().min(1, 'Please write a message.').max(5000),
});

export type ContactInput = z.infer<typeof contactSchema>;
