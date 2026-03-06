-- Migration 003: Enable RLS and create policies (Roam Choreography V1)

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_tokens ENABLE ROW LEVEL SECURITY;

-- users: own row only
CREATE POLICY users_select_own ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY users_update_own ON users FOR UPDATE USING (id = auth.uid());

-- sessions: all operations for own sessions
CREATE POLICY sessions_all_own ON sessions FOR ALL USING (user_id = auth.uid());

-- music_tracks: all operations where session belongs to user
CREATE POLICY music_tracks_all_own_session ON music_tracks FOR ALL
  USING (session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid()));

-- clips: all operations where session belongs to user
CREATE POLICY clips_all_own_session ON clips FOR ALL
  USING (session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid()));

-- analysis_jobs: API (authenticated) can INSERT jobs for own sessions; service_role has explicit full access
CREATE POLICY analysis_jobs_insert_own_session ON analysis_jobs FOR INSERT
  TO authenticated
  WITH CHECK (session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid()));
CREATE POLICY analysis_jobs_service_role_all ON analysis_jobs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- share_tokens: owner can SELECT/INSERT/UPDATE/DELETE; anon SELECT for token-scoped non-revoked access
CREATE POLICY share_tokens_select_anon ON share_tokens FOR SELECT
  TO anon
  USING (
    revoked_at IS NULL
    AND token = NULLIF(trim(current_setting('app.requested_share_token', true)), '')::uuid
  );
CREATE POLICY share_tokens_select_own_session ON share_tokens FOR SELECT
  USING (session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid()));
CREATE POLICY share_tokens_insert_own_session ON share_tokens FOR INSERT
  WITH CHECK (session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid()));
CREATE POLICY share_tokens_update_own_session ON share_tokens FOR UPDATE
  USING (session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid()));
CREATE POLICY share_tokens_delete_own_session ON share_tokens FOR DELETE
  USING (session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid()));
