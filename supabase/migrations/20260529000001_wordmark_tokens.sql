-- Backfill the new `wordmark` block on existing design_tokens rows.
-- Phase 1 task #1: wordmark treatments (gradient/outline/two-tone) require new fields
-- on the DesignTokens JSONB. Default backfill keeps every existing tenant rendering
-- the way it did before — solid treatment, using the current heading font and text color.

update design_tokens
set tokens = jsonb_set(
  tokens,
  '{wordmark}',
  jsonb_build_object(
    'font',          coalesce(tokens->'typography'->>'headingFont', 'Inter'),
    'treatment',     'solid',
    'color1',        coalesce(tokens->'colors'->>'text', '#1a1a1a'),
    'color2',        '',
    'letterSpacing', coalesce(tokens->'typography'->>'headingLetterSpacing', '-0.02em')
  ),
  true
)
where tokens->'wordmark' is null;
