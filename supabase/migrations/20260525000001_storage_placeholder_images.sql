-- Storage bucket for placeholder product images sourced from Pexels.
-- Images are cached here so repeat niche onboarding hits our storage, not Pexels.
-- Public read access — storefront pages display these images directly.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'placeholder-images',
  'placeholder-images',
  true,
  5242880, -- 5MB per file
  array['image/jpeg', 'image/webp', 'image/png']
)
on conflict (id) do nothing;

-- Allow service role full access (writes happen server-side only)
create policy "service role full access on placeholder-images"
  on storage.objects
  for all
  to service_role
  using (bucket_id = 'placeholder-images')
  with check (bucket_id = 'placeholder-images');

-- Allow public read
create policy "public read on placeholder-images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'placeholder-images');
