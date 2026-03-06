-- Migration 002: Create indexes (Roam Choreography V1)

CREATE INDEX ON share_tokens(token);

CREATE INDEX ON clips(session_id, upload_status);

CREATE INDEX ON clips(session_id, recorded_at DESC);

CREATE INDEX ON analysis_jobs(status, timeout_at);
