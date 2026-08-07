# ExamVision AI — Offline Video Segmentation & ROI Detection Using Motion Estimation

Hackathon prototype built for the **Drishti AI Hackathon 2026** by **Team SoulKnight (DI2_26)**.

This system analyzes recorded exam-hall CCTV footage offline. It splits the video frames into a spatial $N \times M$ grid (Region of Interest zones) to separate overlapping motion from multiple people in a crowded room, detects motion in each zone using background subtraction (OpenCV MOG2/KNN), segments continuous active motion into discrete events with start/end timestamps, and provides stubs for integrating object detection (YOLOv8) on flagged events.

---

## Technical Stack
- **Programming Language**: Python 3
- **Libraries**: OpenCV, NumPy, Ultralytics YOLOv8, FastAPI, Streamlit, Pytest

---

## Directory Structure
```
/data
  /datasets
    /phone_chit_detection
      /cheating_dataset   <- Primary dataset for phone/chit fine-tuning
      /exam_cheating_v1  <- Secondary dataset for fine-tuning
    /motion_reference
      /scb_bowturnhead    <- Images sequenced to build test video stream
    /visual_reference
      /cctv_exam_monitor  <- Labeled real exam-hall CCTV images reference
/src
  /motion
    - motion_detector.py  <- OpenCV MOG2/KNN background subtraction & morph filters
    - event_segmenter.py  <- Event grouping state machine with configurable thresholds
  /detection
    - detector.py         <- YOLOv8 object detection wrapper (Stub for now)
  /api
    - main.py             <- FastAPI backend endpoint (Stub for now)
  /dashboard
    - app.py              <- Streamlit frontend control dashboard (Stub for now)
/tests
  - generate_test_video.py <- Helper to sequence image folders into a test MP4 video
  - test_pipeline_manual.py <- Integration script to run and log the full pipeline
requirements.txt          <- Python dependency definitions
README.md                 <- Setup and operation documentation (This file)
```

---

## Setup Instructions

### 1. Create Virtual Environment and Install Dependencies
Activate your local python environment and run:
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

# Install dependencies
pip install -r requirements.txt
```

---

## Running the Pipeline

### Step 1: Generate the Synthetic Test Video
Since continuous raw video is not pre-packaged, sequence a series of real classroom images showing head bows and turns:
```bash
python tests/generate_test_video.py
```
This output is saved to `test_video.mp4` in the project root.

### Step 2: Run the Motion & Event Segmentation Pipeline
Run the integrated motion estimation and event segmentation on the test video:
```bash
python tests/test_pipeline_manual.py
```
This logs segmented events to the terminal and outputs a JSON list of events to `detected_events.json`.
 प्रत्येक event include values:
```json
{
  "start_time": 0.0,
  "end_time": 4.1,
  "zone_id": 4,
  "avg_motion_intensity": 0.0357
}
```
where `zone_id` tracks active regions in the $N \times M$ grid overlay.
