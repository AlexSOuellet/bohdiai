-- A logo image that already contains the shop name shouldn't render the side
-- text wordmark too — that doubles the name. This boolean is set by Vision at
-- upload time (uploadAndAnalyzeLogo): true when the logo prominently includes
-- the shop name, false when it's a pure mark/icon. The Main Street WordmarkLink
-- hides the text span when true.
--
-- Null = "not yet analyzed" (an old tenant uploaded before this feature, or an
-- SVG that Vision skipped). The renderer treats null as false (show both),
-- the safe default that never accidentally hides a maker's name.
alter table public.tenants
  add column if not exists logo_contains_wordmark boolean;

comment on column public.tenants.logo_contains_wordmark is
  'True when the maker''s logo image visibly contains the shop name (Vision-detected at upload). When true, the typographic wordmark is hidden in the header so the name doesn''t render twice. Null = not analyzed; renderer treats as false.';
