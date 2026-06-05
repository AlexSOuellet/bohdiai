/** One-off: run a try-on conversion from the CLI. Proof harness for the engine.
 *  Usage: npx tsx --env-file=.env.local scripts/run-tryon.ts <subdomain> <target> <label> */
import { convertStore } from '../lib/tryon/convert';

async function main() {
  const [subdomain, target, label] = process.argv.slice(2);
  if (!subdomain || !target || !label) {
    console.error('usage: run-tryon.ts <subdomain> <target> <label>');
    process.exit(1);
  }
  console.log(`Converting ${subdomain} -> ${target} (label: ${label})…`);
  const result = await convertStore({ subdomain, targetArchetypeKey: target, label });
  console.log('DONE:', JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error('FAILED:', e);
  process.exit(1);
});
