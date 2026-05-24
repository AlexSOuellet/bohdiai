import Anthropic from '@anthropic-ai/sdk';
import { serverEnv } from './env';

let cached: Anthropic | null = null;

export function anthropicClient(): Anthropic {
  if (cached) return cached;
  cached = new Anthropic({
    apiKey: serverEnv().BOHDIAI_ANTHROPIC_KEY,
    baseURL: 'https://api.anthropic.com',
  });
  return cached;
}
