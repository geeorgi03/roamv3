import logging
import os
import time
from datetime import datetime, timezone

from dotenv import load_dotenv
from supabase import create_client

from roam_music.claim import claim_job
from roam_music.reconciler import reconcile_expired_leases
from roam_music.analyzer import analyze
from roam_music.writer import write_failure, write_success, write_timeout_requeue


def _parse_timeout_at(timeout_at: str) -> datetime:
    s = (timeout_at or "").strip()
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    dt = datetime.fromisoformat(s)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def main() -> None:
    load_dotenv()

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise EnvironmentError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    supabase_client = create_client(url, key)

    while True:
        try:
            try:
                reconcile_expired_leases(supabase_client)
            except Exception as e:
                logging.exception("reconcile_expired_leases failed: %s", e)

            job = claim_job(supabase_client)
            if job is None:
                continue

            job_id = job.get("id")
            try:
                _parse_timeout_at(job["timeout_at"])

                music_track_id = job.get("music_track_id")
                if not music_track_id:
                    raise KeyError("music_track_id missing on claimed job")

                track_resp = (
                    supabase_client.table("music_tracks")
                    .select("storage_path")
                    .eq("id", music_track_id)
                    .single()
                    .execute()
                )
                track = getattr(track_resp, "data", None) or {}
                storage_path = track.get("storage_path")
                if not storage_path:
                    raise KeyError(
                        f"storage_path missing for music_track_id={music_track_id}"
                    )

                result = analyze(supabase_client, storage_path, job["timeout_at"])
            except TimeoutError:
                write_timeout_requeue(supabase_client, job)
                logging.info("job %s: timeout -> requeued/failed", job_id)
            except Exception as e:
                write_failure(supabase_client, job, e)
                logging.exception("job %s: failed", job_id)
            else:
                write_success(supabase_client, job, result)
                logging.info("job %s: complete", job_id)
        finally:
            time.sleep(5)


if __name__ == "__main__":
    main()
