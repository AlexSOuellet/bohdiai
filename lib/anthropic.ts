import Anthropic from '@anthropic-ai/sdk';
import { serverEnv } from './env';

let cached: Anthropic | null = null;

export function anthropicClient(): Anthropic {
  if (cached) return cached;
  const apiKey = serverEnv().BOHDIAI_ANTHROPIC_KEY;
  if (apiKey === undefined) throw new Error('BOHDIAI_ANTHROPIC_KEY is not set — the AI builder can’t run without it');
  cached = new Anthropic({
    apiKey,
    baseURL: 'https://api.anthropic.com',
  });
  return cached;
}
