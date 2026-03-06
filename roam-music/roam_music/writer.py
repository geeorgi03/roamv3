import logging
from datetime import datetime, timedelta, timezone
from typing import Any


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _requeue_timeout_at() -> str:
    """Return UTC ISO string 5 minutes from now for requeued jobs."""
    return (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat().replace(
        "+00:00", "Z"
    )


# Shared policy for claim and requeue; matches claim_analysis_job timeout window.
_future_timeout_iso = _requeue_timeout_at


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
                    "timeout_at": _requeue_timeout_at(),
                    "claimed_at": None,
                    "lease_expires_at": None,
                }
            ).eq("id", job_id).eq("status", "processing").execute()
        else:
            supabase_client.table("analysis_jobs").update(
                {
                    "status": "failed",
                    "attempt_count": attempt_count + 1,
                    "error": "Job timeout exceeded; max retries exceeded",
                }
            ).eq("id", job_id).execute()
            music_track_id = job.get("music_track_id")
            if music_track_id is not None:
                supabase_client.table("music_tracks").update(
                    {"analysis_status": "failed"}
                ).eq("id", music_track_id).execute()
    except Exception:
        logging.exception("write_timeout_requeue failed")
