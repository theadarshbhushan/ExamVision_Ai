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
import os
import shutil
import subprocess
import sys
import traceback
from pathlib import Path

from app.config import (
    ACTIVE_DETECTOR_MODEL,
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
    backend never has to care.
    """
    events_out = []
    video_name = raw.get("video_name", "")
    base_snapshots_path = PIPELINE_SCRIPT_PATH.parent.parent / "data" / "snapshots"
    
    for ev in raw.get("events", []):
        event_id = ev.get("event_id")
        
        def _snapshot_url(snapshot_key: str) -> str | None:
            snapshot_path = ev.get(snapshot_key)
            if not snapshot_path:
                return None
            return f"/snapshot/{job_id}/{Path(snapshot_path).name}"

        detections = [
            {
                "class_name": d.get("class_name") or d.get("label"),
                "confidence": d.get("confidence") or d.get("conf", 0.0),
                "bounding_box": d.get("bounding_box") or d.get("bbox", []),
            }
            for d in ev.get("detections", [])
        ]
        
        has_detections = len(detections) > 0
        snap_type = "annotated" if has_detections else "reference"
        annotated_path = str(base_snapshots_path / video_name / snap_type / f"event_{event_id}.jpg")
        
        ann_url = _snapshot_url("annotated_snapshot") or f"/snapshot/{job_id}/event_{event_id}.jpg"
        ref_url = _snapshot_url("reference_snapshot") or _snapshot_url("after_snapshot") or f"/snapshot/{job_id}/event_{event_id}_after.jpg"
        
        events_out.append(
            {
                "event_id": event_id,
                "start_time": ev.get("start_time"),
                "end_time": ev.get("end_time"),
                "zone_id": ev.get("zone_id"),
                "motion_intensity": ev.get("motion_intensity", 0.0),
                "detections": detections,
                "before_snapshot_url": _snapshot_url("before_snapshot"),
                "after_snapshot_url": _snapshot_url("after_snapshot") or ref_url,
                "annotated_snapshot_url": ann_url,
                "snapshot_url": ann_url,
                "annotated_snapshot_path": annotated_path,
                "reference_snapshot_url": ref_url,
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
        "total_duration": raw.get("total_duration"),
        "frames_sent_to_yolo": frames_to_yolo,
        "bypass_ratio": bypass_ratio or 0.0,
        "events": events_out,
    }


def run_pipeline_job(job_id: str, video_path: Path):
    """Runs synchronously inside a FastAPI BackgroundTask."""
    try:
        _write_status(job_id, "processing", 10)

        # Define clean video name for output
        video_name = video_path.stem
        reports_dir = PIPELINE_SCRIPT_PATH.parent.parent / "data" / "reports"
        reports_dir.mkdir(parents=True, exist_ok=True)
        raw_output_path = reports_dir / f"{video_name}.json"
        
        # Absolute snapshots base dir
        snapshots_base_dir = PIPELINE_SCRIPT_PATH.parent.parent / "data" / "snapshots"
        snapshots_base_dir.mkdir(parents=True, exist_ok=True)

        job_snapshot_dir = SNAPSHOTS_DIR / job_id
        job_snapshot_dir.mkdir(parents=True, exist_ok=True)

        # --- subprocess mode: adjust argv to match pipeline.py CLI ---
        cmd = [
            str(PIPELINE_PYTHON_PATH),
            str(PIPELINE_SCRIPT_PATH),
            "--input", str(video_path),
            "--output", str(raw_output_path),
            "--snapshot-dir", str(snapshots_base_dir),
        ]
        _write_status(job_id, "processing", 30)
        
        env = os.environ.copy()
        env["ACTIVE_DETECTOR_MODEL"] = str(ACTIVE_DETECTOR_MODEL)
        
        result = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=1800)

        if result.returncode != 0:
            _write_status(job_id, "failed", 100, error=result.stderr[-2000:])
            return

        # Copy generated nested snapshots to legacy folder for full backward-compatibility
        ref_src_dir = snapshots_base_dir / video_name / "reference"
        ann_src_dir = snapshots_base_dir / video_name / "annotated"
        
        if ann_src_dir.exists():
            for f in ann_src_dir.glob("*.jpg"):
                shutil.copy2(f, job_snapshot_dir / f.name)
        if ref_src_dir.exists():
            for f in ref_src_dir.glob("*.jpg"):
                ref_filename = f.name.replace(".jpg", "_ref.jpg")
                shutil.copy2(f, job_snapshot_dir / ref_filename)

        _write_status(job_id, "processing", 80)
        raw = json.loads(raw_output_path.read_text())
        contract = _reshape_to_contract(raw, job_id)
        for ev in raw.get("events", []):
            for snapshot_key in ("before_snapshot", "after_snapshot", "annotated_snapshot", "reference_snapshot"):
                snapshot_path = ev.get(snapshot_key)
                if snapshot_path and Path(snapshot_path).exists():
                    dest_path = job_snapshot_dir / Path(snapshot_path).name
                    if not dest_path.exists():
                        dest_path.write_bytes(Path(snapshot_path).read_bytes())
        (RESULTS_DIR / f"{job_id}.json").write_text(json.dumps(contract))

        _write_status(job_id, "done", 100)

    except Exception:
        _write_status(job_id, "failed", 100, error=traceback.format_exc()[-2000:])
