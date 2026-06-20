-- The geographic areas a maker serves (states / regions / cities), in the
-- maker's own words. Drives local SEO: the storefront's LocalBusiness JSON-LD
-- `areaServed` and the meta description. Especially load-bearing for mobile /
-- event service makers who have no fixed storefront address but cover a region.
-- Null/empty when unknown; onboarding will collect it later.
alter table public.tenants
  add column if not exists service_areas text[];

comment on column public.tenants.service_areas is
  'Geographic areas the maker serves (e.g. {"Rhode Island","Connecticut","Massachusetts"}). Drives storefront LocalBusiness areaServed + meta description. Null/empty when unknown.';
