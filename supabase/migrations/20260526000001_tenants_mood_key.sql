-- Add mood_key to tenants so we can always look up which mood was used at onboarding.
-- Nullable because existing tenants were created before this column existed.

alter table tenants add column if not exists mood_key text;
