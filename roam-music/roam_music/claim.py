from __future__ import annotations

import os
from typing import Any

import httpx


def _get_supabase_rest_credentials(supabase_client: Any) -> tuple[str | None, str | None]:
    url = getattr(supabase_client, "supabase_url", None) or os.environ.get("SUPABASE_URL")
    key = getattr(supabase_client, "supabase_key", None) or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    return url, key


def claim_job(supabase_client: Any) -> dict | None:
    """
    Claim a single pending analysis job atomically via PostgREST RPC.

    Returns the claimed job row dict, or None if no job available / on error.
    """
    url, key = _get_supabase_rest_credentials(supabase_client)
    if not url or not key:
        print("claim_job: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
        return None

    rpc_url = f"{url.rstrip('/')}/rest/v1/rpc/claim_analysis_job"

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(
                rpc_url,
                json={},
                headers={
                    "Authorization": f"Bearer {key}",
                    "apikey": key,
                    "Content-Type": "application/json",
                },
            )

        if resp.status_code == 404:
            return None
        resp.raise_for_status()

        data = resp.json()
        if isinstance(data, list):
            return data[0] if data else None
        if isinstance(data, dict):
            return data
        return None
    except Exception as e:
        print(f"claim_job: error claiming job: {e}")
        return None
