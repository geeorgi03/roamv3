-- Migration 008: Extend claim_analysis_job to set timeout_at at claim time
-- Ensures every claimed job has a valid, non-NULL timeout_at for the analyzer
-- and eliminates KeyError on job["timeout_at"] in main.py.

create or replace function claim_analysis_job()
returns setof analysis_jobs
language sql
as $$
  update analysis_jobs
  set
    status = 'processing',
    claimed_at = now(),
    lease_expires_at = now() + interval '60 seconds',
    timeout_at = now() + interval '5 minutes'
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
