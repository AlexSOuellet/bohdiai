/**
 * Runs one step of the automatic build (lib/build/build-sequence.ts) with the
 * real Supabase, Claude, fal, Cloudflare Images and Resend. Server only.
 */
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { supabaseAdmin } from '@/lib/supabase';
import { anthropicClient } from '@/lib/anthropic';
import { resend, fromEmail } from '@/lib/resend';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';
import { falPainter } from './scene-painter';
import type { StepInput } from './build-sequence';
import { attachBackground, draft, finish, makeBackground, planBackgrounds, prepare, write, type BuildDeps } from './site-build';

export function buildDeps(): BuildDeps {
  return {
    db: supabaseAdmin(),
    claude: () => anthropicClient(),
    painter: () => {
      const key = process.env['FAL_API_KEY'];
      if (key === undefined || key === '') throw new Error('FAL_API_KEY is needed to make the background photos');
      return falPainter(key);
    },
    images: async () => {
      const binding = (await getCloudflareContext({ async: true })).env.IMAGES;
      if (binding === undefined) throw new Error('Images binding missing — "images" in wrangler.jsonc');
      return binding;
    },
    send: async (msg) => {
      const { error } = await resend().emails.send({ from: fromEmail(), ...msg });
      return { error: error === null ? null : { message: error.message } };
    },
  };
}

/** One step; its answer is what the next steps are given. */
export async function runStep(deps: BuildDeps, input: StepInput): Promise<unknown> {
  switch (input.step) {
    case 'prepare':
      return prepare(deps, input.intakeId);
    case 'plan':
      return planBackgrounds(deps, input.state);
    case 'background':
      return makeBackground(deps, input.state, input.index, input.plan);
    case 'draft':
      return draft(deps, input.state);
    case 'write':
      return write(deps, input.state, input.drafts);
    case 'finish':
      return finish(deps, input.state);
    case 'attach':
      return attachBackground(deps, input.state);
    case 'failed': {
      const text = `The automatic build stopped for form ${input.intakeId}.\n\n${input.error}\n\nThe form is saved; build it by hand with scripts/intake-to-site.ts once it's fixed.`;
      const sent = await deps.send({ to: SITE_CONTACT_EMAIL, subject: 'A site build stopped', text, html: `<pre>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</pre>` });
      if (sent.error !== null) throw new Error(`telling Alex failed: ${sent.error.message}`);
      return null;
    }
  }
}
