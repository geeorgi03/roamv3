import logging
from datetime import datetime, timezone
from typing import Any

from roam_music.writer import compute_requeue_timeout_at


def reconcile_expired_leases(supabase_client: Any) -> None:
    """
    Requeue or fail analysis jobs whose processing leases have expired.

    - Jobs with attempt_count < 1 (first lease expiry) are moved back to 'pending' and
      attempt_count is incremented.
    - Jobs with attempt_count >= 1 (second lease expiry) are marked as 'failed' with
      attempt_count=2, and their associated music_tracks rows are updated to
      analysis_status='failed'.

    All errors are caught and logged so the caller's poll loop is never disrupted.
    """
    try:
        now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

        resp = (
            supabase_client.table("analysis_jobs")
            .select("*")
            .eq("status", "processing")
            .lt("lease_expires_at", now)
            .execute()
        )

        rows = getattr(resp, "data", None) or []

        for row in rows:
            job_id = row.get("id")
            attempt_count = row.get("attempt_count", 0) or 0
            music_track_id = row.get("music_track_id")

            if attempt_count < 1:
                try:
                    (
                        supabase_client.table("analysis_jobs")
                        .update(
                            {
                                "status": "pending",
                                "attempt_count": attempt_count + 1,
                                "timeout_at": compute_requeue_timeout_at(row),
                                "claimed_at": None,
                                "lease_expires_at": None,
                            }
                        )
                        .eq("id", job_id)
                        .eq("status", "processing")
                        .execute()
                    )
                    logging.info(
                        "Requeued expired analysis job %s (attempt %s)",
                        job_id,
                        attempt_count + 1,
                    )
                except Exception as exc:
                    logging.exception(
                        "Failed to requeue expired analysis job %s: %s", job_id, exc
                    )
            else:
                try:
                    resp = (
                        supabase_client.table("analysis_jobs")
                        .update(
                            {
                                "status": "failed",
                                "attempt_count": attempt_count + 1,
                                "error": "Lease expired; max retries exceeded",
                            }
                        )
                        .eq("id", job_id)
                        .eq("status", "processing")
                        .execute()
                    )

                    if resp.data and len(resp.data) > 0 and music_track_id is not None:
                        (
                            supabase_client.table("music_tracks")
                            .update({"analysis_status": "failed"})
                            .eq("id", music_track_id)
                            .execute()
                        )

                    logging.info(
                        "Marked expired analysis job %s as failed after max retries",
                        job_id,
                    )
                except Exception as exc:
                    logging.exception(
                        "Failed to mark expired analysis job %s as failed: %s",
                        job_id,
                        exc,
                    )
    except Exception as exc:
        logging.exception("reconcile_expired_leases encountered an error: %s", exc)

