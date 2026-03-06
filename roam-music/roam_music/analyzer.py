from __future__ import annotations

import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import essentia.standard as es


def _parse_timeout_at(timeout_at: str) -> datetime:
    s = (timeout_at or "").strip()
    if not s:
        return datetime.max.replace(tzinfo=timezone.utc)
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    dt = datetime.fromisoformat(s)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _raise_if_timed_out(timeout_at_dt: datetime) -> None:
    if datetime.now(timezone.utc) > timeout_at_dt:
        raise TimeoutError("Job timeout exceeded")


def analyze(supabase_client: Any, storage_path: str, timeout_at: str) -> dict:
    timeout_at_dt = _parse_timeout_at(timeout_at)
    _raise_if_timed_out(timeout_at_dt)

    ext = Path(storage_path).suffix
    if not ext:
        ext = ".audio"

    tmp_path: str | None = None
    try:
        audio_bytes = supabase_client.storage.from_("music-tracks").download(storage_path)
        _raise_if_timed_out(timeout_at_dt)

        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as f:
            tmp_path = f.name
            f.write(audio_bytes)

        _raise_if_timed_out(timeout_at_dt)

        sample_rate = 44100
        audio = es.MonoLoader(filename=tmp_path, sampleRate=sample_rate)()
        _raise_if_timed_out(timeout_at_dt)

        bpm, ticks, *_rest = es.RhythmExtractor2013(method="multifeature")(audio)
        _raise_if_timed_out(timeout_at_dt)

        beat_grid: list[dict] = []
        for i, tick in enumerate(ticks):
            time_ms = int(round(float(tick) * 1000.0))
            beat_number = (i % 8) + 1
            beat_grid.append(
                {
                    "time_ms": time_ms,
                    "beat_number": beat_number,
                    "is_downbeat": beat_number == 1,
                }
            )

        frame_size = int(4.0 * sample_rate)
        hop_size = int(2.0 * sample_rate)
        rms_alg = es.RMS()
        rms_values: list[float] = []
        for frame in es.FrameGenerator(audio, frameSize=frame_size, hopSize=hop_size, startFromZero=True):
            rms_values.append(float(rms_alg(frame)))

        mean_rms = (sum(rms_values) / len(rms_values)) if rms_values else 0.0
        threshold = 0.3 * mean_rms if mean_rms > 0 else 0.0

        boundaries_ms: list[int] = []
        for i in range(1, len(rms_values)):
            if abs(rms_values[i] - rms_values[i - 1]) > threshold:
                boundary_sample = i * hop_size
                boundary_ms = int(round((boundary_sample / sample_rate) * 1000.0))
                if boundary_ms > 0:
                    boundaries_ms.append(boundary_ms)

        boundaries_ms = sorted(set(boundaries_ms))
        sections: list[dict] = [{"label": "Intro", "start_ms": 0}]
        for idx, start_ms in enumerate(boundaries_ms, start=2):
            sections.append({"label": f"Section {idx}", "start_ms": start_ms})

        _raise_if_timed_out(timeout_at_dt)
        return {"bpm": float(bpm), "beat_grid": beat_grid, "sections": sections}
    finally:
        if tmp_path:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass

