# ExamVision AI — Backend (FastAPI)

Wraps `pipeline.py` behind the API contract in `ExamVision_AI_Project_Context.md`.
Does not touch any CV/YOLO logic — just upload handling, job tracking, and
reshaping `pipeline.py`'s output JSON into the agreed response shape.

## Setup

```bash
cd Backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --port 8000
```

> [!IMPORTANT]
> **Do not use `--reload` in production/demo run**: Enabling `--reload` makes uvicorn watch the `app/data/` folder. When the pipeline subprocess writes temporary files to `app/data/`, uvicorn restarts the server, killing the active subprocess and leaving jobs orphaned. If hot-reload is required for development, launch uvicorn with `--reload-exclude "app/data"` (no trailing `/*` — on Windows PowerShell, the wildcard gets expanded by the shell before uvicorn sees it, causing an 'unexpected extra arguments' error). This has not been fully verified working — dropping `--reload` entirely, as shown in the Run command above, is the tested and confirmed approach.

Docs at `http://localhost:8000/docs` — Streamlit team can hit these directly.

## Integration with the AI/ML pipeline.py

The backend is fully wired up and integrated with the AI/ML pipeline:

1. `PIPELINE_SCRIPT_PATH` in `app/config.py` points to the real `AI-ML/src/pipeline.py` location.
2. `PIPELINE_PYTHON_PATH` in `app/config.py` automatically detects and invokes the AI/ML virtual environment (`.venv`) so that uvicorn/FastAPI subprocesses can access `ultralytics` and other ML dependencies.
3. `pipeline_runner.py` executes the pipeline via subprocess with arguments `--input`, `--output`, and `--snapshot-dir`.
4. `_reshape_to_contract()` in `pipeline_runner.py` maps the pipeline's raw output JSON onto the required API contract schemas, and copies generated snapshots into the server's snapshot directory for hosting.

Calling `/upload` will now accept video files, queue a pipeline runner task in the background, update execution progress logs, copy snapshot frames, and store formatted JSON results.

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
