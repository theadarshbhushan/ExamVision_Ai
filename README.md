# ExamVision AI — Offline Video Segmentation & ROI Detection Using Motion Estimation


This system analyzes recorded exam-hall CCTV footage offline. It splits the video frames into a spatial $N \times M$ grid (Region of Interest zones) to separate overlapping motion from multiple people in a crowded room, detects motion in each zone using background subtraction (OpenCV MOG2/KNN), segments continuous active motion into discrete events with start/end timestamps, and provides stubs for integrating object detection (YOLOv8) on flagged events.

---

## Technical Stack
- **Programming Language**: Python 3
- **Libraries**: OpenCV, NumPy, Ultralytics YOLOv8, FastAPI, Streamlit, Pytest

---

## Directory Structure
```
/AI-ML                    <- Consolidated AI/ML directory
  /data                   <- Datasets, test footage, snapshots, results (gitignored)
  /models                 <- Fine-tuned and base YOLO checkpoints (gitignored)
  /src                    <- Motion estimation, YOLO wrapper, snapshot generation
  /tests                  <- Pipeline verification and integration tests
  /docs                   <- Edge-case robustness report
  requirements.txt        <- AI/ML-specific dependencies
  README.md               <- AI/ML architecture & operation instructions
/src                      <- Project backend and frontend dashboard
  /api                    <- FastAPI backend endpoint (Stub for now)
  /dashboard              <- Streamlit frontend control dashboard (Stub for now)
.venv/                    <- Project virtual environment (At root for IDE support)
.gitignore                <- Global repository ignore rules
README.md                 <- Setup and operation documentation (This file)
examvision_ai_flowchart.svg <- Whole-project architecture overview (shared)
```

---

## Setup Instructions

### 1. Create Virtual Environment and Install Dependencies
Activate your local python environment and install backend, dashboard, and AI/ML dependencies:
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Windows (Command Prompt):
.venv\Scripts\activate.bat
# Linux/macOS:
source .venv/bin/activate

# Install AI/ML dependencies
pip install -r AI-ML/requirements.txt
```

---

## Running the Pipeline

Run the integrated motion estimation, event segmentation, and YOLOv8 phone/chit classification pipeline:
```bash
python AI-ML/tests/test_full_pipeline.py --video AI-ML/data/test_footage/cctv_real/cctv_01_phone.mkv
```
This logs segmented events to the terminal, crops event peak snapshots to `AI-ML/data/snapshots/cctv_01_phone/annotated/`, and outputs a JSON metadata list of all events to `AI-ML/data/results/cctv_01_phone_results.json`.

Refer to [AI-ML/README.md](AI-ML/README.md) for full documentation on model metrics, configurations, and advanced execution parameters.
