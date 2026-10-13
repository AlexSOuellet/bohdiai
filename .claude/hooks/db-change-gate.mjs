#!/usr/bin/env node
// Safeguard (Modular Plan, step 1.1): Alex approves every database change.
//
// Claude explains each database change in chat and waits for Alex's yes. This
// hook is the backstop: it forces one approval prompt at the moment a change is
// actually applied, in any permission mode. Writing a change file and read-only
// checks (db-migrate --status) pass through without a prompt.

import { readFileSync } from 'node:fs';

const APPLY_COMMANDS = [
  /db-migrate\.mjs(?![^;&|\n]*--status)/i, // applies migrations (--status only reads)
  /\bsupabase\s+(db\s+(push|reset)|migration\s+up)\b/i, // supabase CLI apply commands
  /\bpsql\b/i, // raw SQL against the database
];

function decide(input) {
  const tool = input.tool_name ?? '';
  if (tool !== 'Bash' && tool !== 'PowerShell') return null;
  const command = String(input.tool_input?.command ?? '');
  if (APPLY_COMMANDS.some((re) => re.test(command))) {
    return 'This applies a change to the database. Alex approves every database change after Claude explains it in chat.';
  }
  return null;
}

function ask(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'ask',
      permissionDecisionReason: reason,
    },
  }));
}

let input;
try {
  input = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {
  // Unreadable input: fail closed and ask.
  ask('The database-change check could not read this call, so it needs approval.');
  process.exit(0);
}

const reason = decide(input);
if (reason) ask(reason);
process.exit(0);
