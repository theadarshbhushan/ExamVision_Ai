"""
Wraps the existing AI/ML pipeline.py — does NOT reimplement any CV/YOLO logic.

Two modes, controlled by PIPELINE_MODE in config:
  - "subprocess": calls `python pipeline.py <video_path> <output_json_path>`
                  as a separate process (safest — no import/dependency clashes
                  between backend and AI/ML envs).
  - "import":     imports pipeline.py directly and calls a function in it.
                  Faster, but only use if backend and AI/ML share one venv.

Adjust PIPELINE_CMD / PIPELINE_ENTRYPOINT below once you confirm how
pipeline.py is actually invoked (check with the AI/ML teammate).
"""
import json
import subprocess
import sys
import traceback
from pathlib import Path

from app.config import (
    PIPELINE_PYTHON_PATH,
    PIPELINE_SCRIPT_PATH,
    RESULTS_DIR,
    SNAPSHOTS_DIR,
    STATUS_DIR,
)


def _write_status(job_id: str, status: str, progress: int, error: str | None = None):
    STATUS_DIR.mkdir(parents=True, exist_ok=True)
    payload = {"job_id": job_id, "status": status, "progress": progress}
    if error:
        payload["error"] = error
    (STATUS_DIR / f"{job_id}.json").write_text(json.dumps(payload))


def _reshape_to_contract(raw: dict, job_id: str) -> dict:
    """
    pipeline.py's raw output field names may not exactly match the API
    contract. Do the renaming/mapping here in ONE place so the rest of the
    backend never has to care. Edit the .get(...) keys on the left once you
    see pipeline.py's real output — this is a best-guess mapping based on
    the field names described in the project doc.
    """
    events_out = []
    for ev in raw.get("events", []):
        detections = [
            {
                "class_name": d.get("class_name") or d.get("label"),
                "confidence": d.get("confidence") or d.get("conf", 0.0),
                "bounding_box": d.get("bounding_box") or d.get("bbox", []),
            }
            for d in ev.get("detections", [])
        ]
        events_out.append(
            {
                "event_id": ev.get("event_id"),
                "start_time": ev.get("start_time"),
                "end_time": ev.get("end_time"),
                "zone_id": ev.get("zone_id"),
                "motion_intensity": ev.get("motion_intensity", 0.0),
                "detections": detections,
                "before_snapshot_url": f"/snapshot/{job_id}/{Path(ev.get('before_snapshot', '')).name}"
                if ev.get("before_snapshot") else None,
                "after_snapshot_url": f"/snapshot/{job_id}/{Path(ev.get('after_snapshot', '')).name}"
                if ev.get("after_snapshot") else None,
                "annotated_snapshot_url": f"/snapshot/{job_id}/{Path(ev.get('annotated_snapshot', '')).name}"
                if ev.get("annotated_snapshot") else None,
                "reference_snapshot_url": f"/snapshot/{job_id}/{Path(ev.get('reference_snapshot', '')).name}"
                if ev.get("reference_snapshot") else None,
            }
        )

    total_frames = raw.get("total_frames", 0)
    frames_to_yolo = raw.get("frames_sent_to_yolo", 0)
    bypass_ratio = raw.get("bypass_ratio")
    if bypass_ratio is None and total_frames:
        bypass_ratio = round(1 - (frames_to_yolo / total_frames), 4)

    return {
        "video_name": raw.get("video_name", ""),
        "total_frames": total_frames,
        "frames_sent_to_yolo": frames_to_yolo,
        "bypass_ratio": bypass_ratio or 0.0,
        "events": events_out,
    }


def run_pipeline_job(job_id: str, video_path: Path):
    """Runs synchronously inside a FastAPI BackgroundTask."""
    try:
        _write_status(job_id, "processing", 10)

        raw_output_path = RESULTS_DIR / f"{job_id}_raw.json"
        job_snapshot_dir = SNAPSHOTS_DIR / job_id
        job_snapshot_dir.mkdir(parents=True, exist_ok=True)

        # --- subprocess mode: adjust argv to match pipeline.py's real CLI ---
        cmd = [
            str(PIPELINE_PYTHON_PATH),
            str(PIPELINE_SCRIPT_PATH),
            "--input", str(video_path),
            "--output", str(raw_output_path),
            "--snapshot-dir", str(job_snapshot_dir),
        ]
        _write_status(job_id, "processing", 30)
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=1800)

        if result.returncode != 0:
            _write_status(job_id, "failed", 100, error=result.stderr[-2000:])
            return

        _write_status(job_id, "processing", 80)
        raw = json.loads(raw_output_path.read_text())
        contract = _reshape_to_contract(raw, job_id)
        (RESULTS_DIR / f"{job_id}.json").write_text(json.dumps(contract))

        _write_status(job_id, "done", 100)

    except Exception:
        _write_status(job_id, "failed", 100, error=traceback.format_exc()[-2000:])
