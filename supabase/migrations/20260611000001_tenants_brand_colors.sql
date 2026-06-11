-- Persist the logo's extracted brand colors on the tenant so the renderer can
-- guarantee logo contrast (render-time) and a late upload re-anchors cleanly.
-- Ordered by visual prominence; empty/absent when no raster logo was analyzed.
alter table public.tenants
  add column if not exists brand_colors text[];

comment on column public.tenants.brand_colors is
  'Dominant logo ink colors (hex), prominence-ordered. Drives render-time logo header contrast. Null/empty when no logo or SVG/failed analysis.';
