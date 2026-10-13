#!/usr/bin/env node
// Safeguard (Modular Plan, step 1.1): Alex approves every database change.
//
// Runs before every Write / Edit / Bash / PowerShell call. When the call would
// create or change a migration file, or run something that applies changes to
// the database schema, it forces an approval prompt for Alex, whatever
// permission mode the session is in. Everything else passes through untouched.

import { readFileSync } from 'node:fs';

const MIGRATION_PATH = /supabase[\\/]+migrations[\\/]/i;
const SCHEMA_COMMANDS = [
  /db-migrate\.mjs/i, // applies migrations
  /\bsupabase\s+(db|migration)\b/i, // supabase CLI schema commands
  /\bpsql\b/i, // raw SQL against the database
];

function decide(input) {
  const tool = input.tool_name ?? '';
  const args = input.tool_input ?? {};

  if (tool === 'Write' || tool === 'Edit' || tool === 'NotebookEdit') {
    const path = String(args.file_path ?? args.notebook_path ?? '');
    if (MIGRATION_PATH.test(path)) {
      return 'This writes a database change file. Alex approves every database change: say in one plain sentence what it is for.';
    }
    return null;
  }

  if (tool === 'Bash' || tool === 'PowerShell') {
    const command = String(args.command ?? '');
    if (SCHEMA_COMMANDS.some((re) => re.test(command))) {
      return 'This applies a change to the database. Alex approves every database change: say in one plain sentence what it is for.';
    }
    if (MIGRATION_PATH.test(command) && /(>|tee|cp|mv|copy|move|Set-Content|Out-File|New-Item|Remove-Item|rm\s)/i.test(command)) {
      return 'This touches a database change file from the shell. Alex approves every database change.';
    }
  }
  return null;
}

let input = {};
try {
  input = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {
  // Unreadable input: fail closed and ask.
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'ask',
      permissionDecisionReason: 'Database-change check could not read this call, so it needs approval.',
    },
  }));
  process.exit(0);
}

const reason = decide(input);
if (reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'ask',
      permissionDecisionReason: reason,
    },
  }));
}
process.exit(0);
