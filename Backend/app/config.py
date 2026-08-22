import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

UPLOADS_DIR = DATA_DIR / "uploads"
RESULTS_DIR = DATA_DIR / "results"
SNAPSHOTS_DIR = DATA_DIR / "snapshots"
STATUS_DIR = DATA_DIR / "status"
REVIEWS_DIR = DATA_DIR / "reviews"

for d in [UPLOADS_DIR, RESULTS_DIR, SNAPSHOTS_DIR, STATUS_DIR, REVIEWS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Point this at the AI/ML team's real pipeline.py location.
PIPELINE_SCRIPT_PATH = BASE_DIR.parent.parent / "AI-ML" / "src" / "pipeline.py"

# Try to find the AI/ML venv Python executable, fallback to sys.executable
import sys
_venv_win = BASE_DIR.parent.parent / ".venv" / "Scripts" / "python.exe"
_venv_unix = BASE_DIR.parent.parent / ".venv" / "bin" / "python"
if _venv_win.exists():
    PIPELINE_PYTHON_PATH = _venv_win
elif _venv_unix.exists():
    PIPELINE_PYTHON_PATH = _venv_unix
else:
    print("WARNING: Could not find default AI-ML virtual environment '.venv' at project root. Attempting fallbacks...", flush=True)
    _venv312_win = BASE_DIR.parent.parent / ".venv312" / "Scripts" / "python.exe"
    _venv312_unix = BASE_DIR.parent.parent / ".venv312" / "bin" / "python"
    if _venv312_win.exists():
        PIPELINE_PYTHON_PATH = _venv312_win
        print(f"Fallback resolution: Using '.venv312' virtual environment at: {PIPELINE_PYTHON_PATH}", flush=True)
    elif _venv312_unix.exists():
        PIPELINE_PYTHON_PATH = _venv312_unix
        print(f"Fallback resolution: Using '.venv312' virtual environment at: {PIPELINE_PYTHON_PATH}", flush=True)
    else:
        PIPELINE_PYTHON_PATH = Path(sys.executable)
        print(f"CRITICAL WARNING: No dedicated AI-ML virtual environment found. Running pipeline under current uvicorn process Python context: {PIPELINE_PYTHON_PATH}", flush=True)

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("Missing required environment variable: MONGO_URI. Set it in Backend/.env.")

MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")
if not MONGO_DB_NAME:
    raise RuntimeError("Missing required environment variable: MONGO_DB_NAME. Set it in Backend/.env.")

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("Missing required environment variable: JWT_SECRET. Set it in Backend/.env.")

JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").strip().lower() in {"1", "true", "yes", "on"}

# Default production model weights path and active model environment variable override
DEFAULT_DETECTOR_MODEL = BASE_DIR.parent.parent / "AI-ML" / "models" / "phone_chit_detector_v4.pt"
ACTIVE_DETECTOR_MODEL = os.getenv("ACTIVE_DETECTOR_MODEL", str(DEFAULT_DETECTOR_MODEL))

