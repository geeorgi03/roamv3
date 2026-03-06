-- Migration 007: Fix claim_analysis_job for already-migrated environments
-- Ensures no claim-time attempt_count increment and timeout_at validity guard.
-- Historical migration 001 is unchanged; this migration rolls out the fix.

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
