import { Resend } from 'resend';
import { serverEnv } from './env';

let cached: Resend | null = null;

export function resend(): Resend {
  if (cached) return cached;
  const env = serverEnv();
  cached = new Resend(env.RESEND_API_KEY);
  return cached;
}

export function fromEmail(): string {
  return serverEnv().RESEND_FROM_EMAIL;
}
