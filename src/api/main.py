from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any
import os

app = FastAPI(
    title="ExamVision AI API",
    description="Offline Video Segmentation & ROI Detection API for Drishti AI Hackathon 2026",
    version="0.1.0"
)

class AnalysisRequest(BaseModel):
    video_path: str
    grid_rows: int = 3
    grid_cols: int = 3
    motion_threshold: float = 0.02
    min_event_frames: int = 5
    max_gap_frames: int = 15

@app.get("/")
def read_root():
    return {
        "status": "online",
        "project": "ExamVision AI",
        "description": "Hackathon prototype API for motion-guided exam-hall monitoring."
    }

@app.post("/analyze")
def analyze_video(request: AnalysisRequest, background_tasks: BackgroundTasks):
    """
    Triggers motion segmentation on a video path.
    TODO: Integrate MotionDetector and EventSegmenter to process video,
    and log outputs to a DB or JSON file.
    """
    if not os.path.exists(request.video_path):
        return {"error": f"Video path {request.video_path} does not exist."}
        
    # Trigger background execution:
    # background_tasks.add_task(run_analysis_pipeline, request)
    
    return {
        "status": "queued",
        "message": f"Started background analysis on {request.video_path}",
        "config": request.dict()
    }

@app.get("/events/{video_id}")
def get_events(video_id: str):
    """
    Returns segmented events for a specific video run.
    TODO: Query event database or read JSON output file.
    """
    return {
        "video_id": video_id,
        "events": []
    }
