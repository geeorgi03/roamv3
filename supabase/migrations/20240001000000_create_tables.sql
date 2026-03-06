-- Migration 001: Create all tables (Roam Choreography V1)
-- Tables created in dependency order.

-- 1. users — links to Supabase Auth
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'creator', 'pro', 'studio')),
  created_at timestamptz DEFAULT now()
);

-- 2. sessions — FK to users
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. music_tracks — FK to sessions
CREATE TABLE music_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('upload', 'youtube')),
  source_url text,
  storage_path text,
  bpm float,
  beat_grid jsonb,
  sections jsonb DEFAULT '[]',
  analysis_status text DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'complete', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- 4. clips — FK to sessions
CREATE TABLE clips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  local_id uuid NOT NULL,
  label text NOT NULL DEFAULT 'Clip',
  mux_upload_id text,
  mux_asset_id text UNIQUE,
  mux_playback_id text,
  mux_passthrough jsonb,
  upload_status text NOT NULL DEFAULT 'local' CHECK (upload_status IN ('local', 'queued', 'uploading', 'processing', 'ready', 'failed')),
  move_name text,
  style text,
  energy text,
  difficulty text,
  bpm integer,
  notes text,
  recorded_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (session_id, local_id)
);

-- 5. analysis_jobs — FKs to sessions and music_tracks
CREATE TABLE analysis_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  music_track_id uuid NOT NULL REFERENCES music_tracks(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
  attempt_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  claimed_at timestamptz,
  lease_expires_at timestamptz,
  completed_at timestamptz,
  timeout_at timestamptz,
  error text
);

-- 7. claim_analysis_job RPC: atomically claim a single pending job
create or replace function claim_analysis_job()
returns setof analysis_jobs
language sql
as $$
  update analysis_jobs
  set
    status = 'processing',
    claimed_at = now(),
    lease_expires_at = now() + interval '60 seconds'
  where id = (
    select id
    from analysis_jobs
    where status = 'pending'
    and (timeout_at is null or timeout_at > now())
    order by created_at
    for update skip locked
    limit 1
  )
  returning *;
$$;

-- 6. share_tokens — FK to sessions
CREATE TABLE share_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  revoked_at timestamptz
);
