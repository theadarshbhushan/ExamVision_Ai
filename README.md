# ExamVision AI — Offline Video Segmentation & ROI Detection Using Motion Estimation

This system analyzes recorded exam-hall CCTV footage offline. It splits the video frames into a spatial $N \times M$ grid (Region of Interest zones) to separate overlapping motion from multiple people in a crowded room, detects motion in each zone using background subtraction (OpenCV MOG2/KNN), segments continuous active motion into discrete events with start/end timestamps, and provides stubs for integrating object detection (YOLOv8) on flagged events.

---

## Technical Stack
- **Programming Language**: Python 3
- **Libraries**: OpenCV, NumPy, Ultralytics YOLOv8, FastAPI, Next.js, Tailwind CSS

---

## Directory Structure
```
/AI-ML                    <- Object Detection and Motion Segmentation Engine
  /data                   <- Test footage and output directories (gitignored)
  /models                 <- Model checkpoints (gitignored)
  /src                    <- Core logic: motion detector, detector, pipeline orchestration
  /tests                  <- Pipeline and feature test files
  requirements.txt        <- AI/ML dependencies (ultralytics, opencv, torch)
  README.md               <- AI/ML engine documentation
/Backend                  <- FastAPI application serving the API contract
  /app                    <- Backend routes, config, and pipeline runner logic
  /app/data               <- Database status, reviews, and hosted snapshot output (gitignored)
  /venv                   <- Backend-specific virtual environment (gitignored)
  requirements.txt        <- Backend server dependencies (fastapi, uvicorn)
  README.md               <- Backend configuration and execution guide
/frontend                 <- Next.js Audit Portal Dashboard
  /app                    <- Next.js page views and layouts
  /components             <- Tailwind dashboard UI components and charts
  /lib                    <- api-client and static schemas
  README.md               <- Frontend dashboard setup guide
.venv/                    <- Root virtual environment housing AI-ML packages
.gitignore                <- Global repository ignore rules
README.md                 <- Setup and operation documentation (This file)
```

---

## Setup & Operation Instructions

### 1. Download Model Weights
Before running the pipeline or starting the server, you must download the fine-tuned model checkpoint weights:
* **Download URL**: [phone_chit_detector_v4.pt](https://github.com/theadarshbhushan/ExamVision_Ai/releases/download/v1.0-model/phone_chit_detector_v4.pt) (5.93 MB)
* **Destination Path**: Place the file at `AI-ML/models/phone_chit_detector_v4.pt`.

---

### 2. Component Setup & Execution

#### Component A: AI/ML Detection Engine
Installs the computer vision and deep learning packages inside the root `.venv`.
```bash
# 1. Navigate to repository root (if not already there)
cd ExamVision_Ai

# 2. Create the root virtual environment
python -m venv .venv

# 3. Activate the root virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Windows (Command Prompt):
.venv\Scripts\activate.bat
# Linux/macOS:
source .venv/bin/activate

# 4. Install ML dependencies (includes PyTorch and Ultralytics)
pip install -r AI-ML/requirements.txt

# 5. Run the CLI pipeline test
python AI-ML/tests/test_full_pipeline.py --video AI-ML/data/test_footage/cctv_real/cctv_01_phone.mkv
```

#### Component B: FastAPI Backend Server
Installs backend web server packages inside a separate virtual environment (`Backend/venv`). The backend will automatically invoke the root `.venv` Python context when calling the ML pipeline in a subprocess.
```bash
# 1. Open Backend directory
cd Backend

# 2. Create a backend-specific virtual environment
python -m venv venv

# 3. Activate the backend virtual environment
# Windows (PowerShell):
venv\Scripts\Activate.ps1
# Windows (Command Prompt):
venv\Scripts\activate.bat
# Linux/macOS:
source venv/bin/activate

# 4. Install backend web dependencies
pip install -r requirements.txt

# 5. Start the FastAPI server
uvicorn app.main:app --port 8000
```
> [!IMPORTANT]
> **Why `--reload` is omitted**: With `--reload` enabled, uvicorn watches the entire `Backend/` directory including `app/data/`, where the pipeline subprocess writes status and results files during processing. This causes uvicorn to detect the change and restart mid-job, killing the running pipeline subprocess and leaving jobs permanently stuck. If hot-reload is needed for active development, exclude `app/data/*` from the reload watch path first.

* API docs are served at: `http://localhost:8000/docs`

#### Component C: Next.js Frontend Dashboard
Renders the visual web portal for reviewing proctoring telemetry.
```bash
# 1. Open frontend directory
cd frontend

# 2. Install Node packages
npm install

# 3. Start development server
npm run dev
```
* Portal opens at: `http://localhost:3000`
* Expects the Backend API to be running concurrently at `http://localhost:8000`.
