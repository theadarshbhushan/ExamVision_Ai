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
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").strip().lower() in {"1", "true", "yes", "on"}
