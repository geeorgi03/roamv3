import logging
from datetime import datetime, timedelta, timezone
from typing import Any


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def compute_requeue_timeout_at(job: dict) -> str:
    """
    Compute timeout_at for requeued jobs, preserving the original adaptive window.

    Derives window length from the prior claim interval (timeout_at - claimed_at)
    and reapplies it from now. Falls back to 5 minutes for legacy rows without
    claimed_at/timeout_at. Central policy for both timeout and lease-recovery paths.
    """
    claimed_at = job.get("claimed_at")
    timeout_at = job.get("timeout_at")
    if claimed_at and timeout_at:
        try:
            claimed = datetime.fromisoformat(claimed_at.replace("Z", "+00:00"))
            timeout = datetime.fromisoformat(timeout_at.replace("Z", "+00:00"))
            window_seconds = (timeout - claimed).total_seconds()
            if window_seconds > 0:
                new_timeout = datetime.now(timezone.utc) + timedelta(
                    seconds=window_seconds
                )
                return new_timeout.isoformat().replace("+00:00", "Z")
        except (ValueError, TypeError):
            pass
    return (
        (datetime.now(timezone.utc) + timedelta(minutes=5))
        .isoformat()
        .replace("+00:00", "Z")
    )


def write_success(supabase_client: Any, job: dict, result: dict) -> None:
    """Update music_tracks with analysis results and mark analysis_jobs complete."""
    try:
        music_track_id = job.get("music_track_id")
        job_id = job.get("id")
        if not music_track_id or not job_id:
            logging.warning("write_success: missing music_track_id or job id")
            return

        supabase_client.table("music_tracks").update(
            {
                "bpm": result.get("bpm"),
                "beat_grid": result.get("beat_grid"),
                "sections": result.get("sections"),
                "analysis_status": "complete",
            }
        ).eq("id", music_track_id).execute()

        supabase_client.table("analysis_jobs").update(
            {
                "status": "complete",
                "completed_at": _utc_now_iso(),
            }
        ).eq("id", job_id).execute()
    except Exception:
        logging.exception("write_success failed")


def write_failure(supabase_client: Any, job: dict, error: Exception) -> None:
    """Mark music_tracks and analysis_jobs as failed with error message."""
    try:
        music_track_id = job.get("music_track_id")
        job_id = job.get("id")
        if not job_id:
            logging.warning("write_failure: missing job id")
            return

        err_str = str(error)[:2000]

        supabase_client.table("analysis_jobs").update(
            {
                "status": "failed",
                "error": err_str,
            }
        ).eq("id", job_id).execute()

        if music_track_id is not None:
            supabase_client.table("music_tracks").update(
                {"analysis_status": "failed"}
            ).eq("id", music_track_id).execute()
    except Exception:
        logging.exception("write_failure failed")


def write_timeout_requeue(supabase_client: Any, job: dict) -> None:
    """Requeue job if attempt_count < 1 (first timeout), else mark as failed at attempt_count=2."""
    try:
        job_id = job.get("id")
        attempt_count = job.get("attempt_count", 0) or 0

        if attempt_count < 1:
            supabase_client.table("analysis_jobs").update(
                {
                    "status": "pending",
                    "attempt_count": attempt_count + 1,
                    "timeout_at": compute_requeue_timeout_at(job),
                    "claimed_at": None,
                    "lease_expires_at": None,
                }
            ).eq("id", job_id).eq("status", "processing").execute()
        else:
            resp = (
                supabase_client.table("analysis_jobs")
                .update(
                    {
                        "status": "failed",
                        "attempt_count": attempt_count + 1,
                        "error": "Job timeout exceeded; max retries exceeded",
                    }
                )
                .eq("id", job_id)
                .eq("status", "processing")
                .execute()
            )
            if resp.data and len(resp.data) > 0 and job.get("music_track_id"):
                supabase_client.table("music_tracks").update(
                    {"analysis_status": "failed"}
                ).eq("id", job["music_track_id"]).execute()
    except Exception:
        logging.exception("write_timeout_requeue failed")
