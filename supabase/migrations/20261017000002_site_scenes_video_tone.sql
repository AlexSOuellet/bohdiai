-- The photo behind a Scenic site can be a looping clip, and light or dark (Alex
-- approved, Session 107, 2026-10-17).
--   video_upload_id  a short muted clip that loops behind the page over the
--                    photo (the photo stays: it shows where a clip can't play —
--                    phones in battery saver, visitors with motion turned off).
--   tone             how light the photo is: on a dark one the opening's
--                    lettering turns light and the clip is dimmed.

alter table site_scenes
  add column if not exists video_upload_id uuid references uploads(id) on delete set null,
  add column if not exists tone text not null default 'light' check (tone in ('light', 'dark'));

comment on column site_scenes.video_upload_id is
  'A short muted clip that loops behind the page over the photo (Scenic). Null: the photo alone.';
comment on column site_scenes.tone is
  'How light the photo behind the page is: dark turns the opening''s lettering light and dims the clip.';
