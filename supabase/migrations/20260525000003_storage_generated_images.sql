-- Storage bucket for AI-generated images produced by fal.ai FLUX Pro.
-- Used for hero background images and product photos generated at onboarding.
-- Public read access — storefront pages display these images directly.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'generated-images',
  'generated-images',
  true,
  10485760, -- 10MB per file (AI images can be larger than Pexels cache)
  array['image/jpeg', 'image/webp', 'image/png']
)
on conflict (id) do nothing;

-- Allow service role full access (writes happen server-side only)
create policy "service role full access on generated-images"
  on storage.objects
  for all
  to service_role
  using (bucket_id = 'generated-images')
  with check (bucket_id = 'generated-images');

-- Allow public read
create policy "public read on generated-images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'generated-images');
