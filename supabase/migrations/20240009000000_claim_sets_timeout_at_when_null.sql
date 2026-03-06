-- Migration 009: Fix claim_analysis_job for already-migrated databases
-- Sets timeout_at only when null (no overwrite). Keeps same atomic claim and
-- timeout guard behavior. Historical 008 unchanged; this migration ensures
-- production and other upgraded databases receive the runtime fix.

create or replace function claim_analysis_job()
returns setof analysis_jobs
language sql
as $$
  update analysis_jobs
  set
    status = 'processing',
    claimed_at = now(),
    lease_expires_at = now() + interval '60 seconds',
    timeout_at = coalesce(timeout_at, now() + interval '5 minutes')
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
