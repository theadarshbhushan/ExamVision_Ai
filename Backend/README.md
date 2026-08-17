# ExamVision AI — Backend (FastAPI)

Wraps `pipeline.py` behind the API contract in `ExamVision_AI_Project_Context.md`.
Does not touch any CV/YOLO logic — just upload handling, job tracking, and
reshaping `pipeline.py`'s output JSON into the agreed response shape.

## Setup

```bash
cd examvision_backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

Docs at `http://localhost:8000/docs` — Streamlit team can hit these directly.

## Wiring up the real pipeline.py (do this first)

1. Set `PIPELINE_SCRIPT_PATH` in `app/config.py` to the real path of
   `pipeline.py` (defaults to `../../AI-ML/src/pipeline.py` relative to `app/`).
2. `pipeline_runner.py` currently calls it as:
   ```
   python pipeline.py --input <video> --output <json> --snapshot-dir <dir>
   ```
   Confirm with the AI/ML teammate what CLI args `pipeline.py` actually
   accepts (or what function signature it exposes, if you'd rather import it
   directly instead of subprocess) and edit the `cmd = [...]` list in
   `run_pipeline_job()` to match.
3. `_reshape_to_contract()` in `pipeline_runner.py` maps pipeline.py's raw
   field names (`label`/`class_name`, `conf`/`confidence`, `bbox`/
   `bounding_box`, snapshot path fields) onto the contract's field names.
   Once you see real output JSON from pipeline.py, adjust the `.get(...)`
   fallbacks so nothing silently comes back `None`.

Until that's wired up, `/upload` will still accept files and create jobs,
but `/status` will report `"failed"` because `pipeline.py` isn't found at
the configured path — that's expected until step 1 is done.

## Endpoints (exact contract)

| Method | Path | Purpose |
|---|---|---|
| POST | `/upload` | multipart video → `{job_id, status}` |
| GET | `/status/{job_id}` | poll job progress |
| GET | `/results/{job_id}` | full event list once done |
| GET | `/snapshot/{job_id}/{filename}` | serves an image file |
| POST | `/events/{job_id}/{event_id}/review` | approve/dismiss an event |
| GET | `/heatmap/{job_id}` | per-zone intensity aggregation |

## Design notes

- **Background tasks, not a queue** — fine for a hackathon demo; `/upload`
  returns immediately, `run_pipeline_job` runs in-process via FastAPI's
  `BackgroundTasks`. No Celery/Redis needed.
- **Status = JSON file per job** — `data/status/{job_id}.json`, matches the
  doc's suggestion of no database.
- **Reviews = JSON file per job** — `data/reviews/{job_id}.json`, merged
  into `/results` responses on read so the frontend doesn't need a second
  call to see review state.
- **subprocess over import** — keeps the AI/ML team's Python env
  (OpenCV, YOLO, torch) fully decoupled from the backend's env. If you'd
  rather import `pipeline.py` directly for speed, switch mode in
  `pipeline_runner.py` — only that one file needs to change.
- **CORS wide open** — matches the doc's request so Streamlit (different
  port) can call this without extra config.

## Testing without a real video / pipeline.py yet

Drop a fake `data/results/{job_id}.json` (contract shape) and a matching
`data/status/{job_id}.json` with `"status": "done"` directly into the data
folders, then hit `/results/{job_id}` — lets the Streamlit team's
`api_client.py` be pointed at real endpoints before pipeline.py is wired in,
without needing you to run it end-to-end yet.
