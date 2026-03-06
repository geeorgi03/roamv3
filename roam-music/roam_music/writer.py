from __future__ import annotations

from datetime import datetime
from typing import Any


def write_success(supabase_client: Any, job: dict, result: dict) -> None:
    try:
        (
            supabase_client.table("music_tracks")
            .update(
                {
                    "bpm": result["bpm"],
                    "beat_grid": result["beat_grid"],
                    "sections": result["sections"],
                    "analysis_status": "complete",
                }
            )
            .eq("id", job["music_track_id"])
            .execute()
        )
        (
            supabase_client.table("analysis_jobs")
            .update({"status": "complete", "completed_at": datetime.utcnow().isoformat() + "Z"})
            .eq("id", job["id"])
            .execute()
        )
    except Exception as e:
        print(f"write_success: error: {e}")


def write_failure(supabase_client: Any, job: dict, error: Exception) -> None:
    try:
        (
            supabase_client.table("music_tracks")
            .update({"analysis_status": "failed"})
            .eq("id", job["music_track_id"])
            .execute()
        )
        (
            supabase_client.table("analysis_jobs")
            .update({"status": "failed", "error_message": str(error)[:2000]})
            .eq("id", job["id"])
            .execute()
        )
    except Exception as e:
        print(f"write_failure: error: {e}")


def write_timeout_requeue(supabase_client: Any, job: dict) -> None:
    try:
        attempt_count = int(job.get("attempt_count") or 0)
        if attempt_count < 2:
            (
                supabase_client.table("analysis_jobs")
                .update({"status": "pending", "attempt_count": attempt_count + 1})
                .eq("id", job["id"])
                .execute()
            )
        else:
            write_failure(supabase_client, job, Exception("Timeout: max retries exceeded"))
    except Exception as e:
        print(f"write_timeout_requeue: error: {e}")

