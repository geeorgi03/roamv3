from __future__ import annotations

from datetime import datetime
from typing import Any


def reconcile_expired_leases(supabase_client: Any) -> None:
    try:
        now_iso = datetime.utcnow().isoformat() + "Z"
        resp = (
            supabase_client.table("analysis_jobs")
            .select("*")
            .eq("status", "processing")
            .lt("lease_expires_at", now_iso)
            .execute()
        )

        rows = getattr(resp, "data", None) or []
        for row in rows:
            attempt_count = int(row.get("attempt_count") or 0)
            job_id = row.get("id")
            music_track_id = row.get("music_track_id")

            if attempt_count < 2:
                (
                    supabase_client.table("analysis_jobs")
                    .update({"status": "pending", "attempt_count": attempt_count + 1})
                    .eq("id", job_id)
                    .execute()
                )
            else:
                (
                    supabase_client.table("analysis_jobs")
                    .update(
                        {
                            "status": "failed",
                            "error_message": "Lease expired; max retries exceeded",
                        }
                    )
                    .eq("id", job_id)
                    .execute()
                )
                (
                    supabase_client.table("music_tracks")
                    .update({"analysis_status": "failed"})
                    .eq("id", music_track_id)
                    .execute()
                )
    except Exception as e:
        print(f"reconcile_expired_leases: error: {e}")
        return

