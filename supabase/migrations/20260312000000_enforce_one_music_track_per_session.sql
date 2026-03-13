-- Enforce V1 contract: one active music track per session
-- If duplicates exist, keep the most recently created row per session_id.

with ranked as (
  select
    id,
    session_id,
    row_number() over (partition by session_id order by created_at desc) as rn
  from music_tracks
)
delete from music_tracks
where id in (select id from ranked where rn > 1);

-- Enforce at DB level
alter table music_tracks
  add constraint music_tracks_session_id_unique unique (session_id);

