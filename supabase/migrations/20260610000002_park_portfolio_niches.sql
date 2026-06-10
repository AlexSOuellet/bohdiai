-- Park the portfolio/service niches that Main Street does not fit.
-- Tattoo artist, photographer, and fine artist are true portfolio businesses
-- (visual work shown to be admired or commissioned, no real product catalog);
-- sewing & alterations is a pure service. Main Street is a product sales page,
-- so onboarding any of these to it produces a wrong store.
--
-- We move them to 'draft' (parked) rather than 'retired' (dead): only 'approved'
-- niches are offered at onboarding or read by the AI, so this takes them out of
-- circulation immediately, and they flip straight back to 'approved' once a
-- fitting build strategy (e.g. the Body of Work archetype) exists for them.
update niches
set status = 'draft',
    updated_at = now()
where slug in ('tattoo_artist', 'photographer', 'fine_artist', 'sewing_alterations')
  and status = 'approved';
