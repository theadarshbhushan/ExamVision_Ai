import json
import shutil
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import BackgroundTasks, Depends, FastAPI, File, HTTPException, Request, Response, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.auth import create_access_token, get_current_user, hash_password, require_role, serialize_user, verify_password
from app.config import (
    BASE_DIR,
    COOKIE_SECURE,
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
    RESULTS_DIR,
    REVIEWS_DIR,
    SNAPSHOTS_DIR,
    STATUS_DIR,
    UPLOADS_DIR,
)
from app.database import close_database, get_collection, initialize_database
from app.models import (
    ExamCreate,
    ExamResponse,
    ExamSessionCreate,
    ExamSessionResponse,
    ExamUpdate,
    HeatmapResponse,
    ReviewRequest,
    ReviewResponse,
    StatusResponse,
    StudentCreate,
    StudentResponse,
    TokenResponse,
    UploadResponse,
    UserAuthResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
    ZoneHeat,
)
from app.pipeline_runner import run_pipeline_job

app = FastAPI(title="ExamVision AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    initialize_database()


@app.on_event("shutdown")
async def shutdown_event():
    close_database()


def _status_path(job_id: str) -> Path:
    return STATUS_DIR / f"{job_id}.json"


def _results_path(job_id: str) -> Path:
    return RESULTS_DIR / f"{job_id}.json"


def _set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        max_age=JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )


def _serialize_student(document: dict):
    item = dict(document)
    item["id"] = str(item.pop("_id"))
    item["user_id"] = str(item["user_id"])
    if isinstance(item.get("created_at"), datetime):
        item["created_at"] = item["created_at"].isoformat()
    if isinstance(item.get("updated_at"), datetime):
        item["updated_at"] = item["updated_at"].isoformat()
    return item


def _serialize_exam(document: dict):
    item = dict(document)
    item["id"] = str(item.pop("_id"))
    item["created_by"] = str(item["created_by"])
    for field_name in ("start_time", "end_time", "created_at", "updated_at"):
        if isinstance(item.get(field_name), datetime):
            item[field_name] = item[field_name].isoformat()
    return item


def _serialize_exam_session(document: dict):
    item = dict(document)
    item["id"] = str(item.pop("_id"))
    item["exam_id"] = str(item["exam_id"])
    item["student_id"] = str(item["student_id"])
    for field_name in ("started_at", "ended_at", "created_at", "updated_at"):
        if isinstance(item.get(field_name), datetime):
            item[field_name] = item[field_name].isoformat()
    return item


@app.post("/api/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(payload: UserRegisterRequest):
    users = get_collection("users")
    normalized_email = payload.email.lower()
    if users.find_one({"email": normalized_email}):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user_doc = {
        "_id": str(uuid.uuid4()),
        "email": normalized_email,
        "password_hash": hash_password(payload.password),
        "full_name": payload.full_name.strip(),
        "role": payload.role,
        "is_active": True,
        "created_at": datetime.utcnow(),
    }

    users.insert_one(user_doc)
    return UserResponse(**serialize_user(user_doc))


@app.post("/api/auth/login", response_model=UserAuthResponse)
async def login_user(payload: UserLoginRequest, response: Response):
    users = get_collection("users")
    normalized_email = payload.email.lower()
    user_doc = users.find_one({"email": normalized_email})

    if not user_doc or not verify_password(payload.password, user_doc.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user_doc.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    token = create_access_token(user_doc["_id"])
    _set_auth_cookie(response, token)
    return {"user": UserResponse(**serialize_user(user_doc))}


@app.post("/api/auth/logout", response_model=TokenResponse)
async def logout_user(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"message": "Logged out successfully"}


@app.get("/api/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)


@app.get("/api/auth/admin-check")
async def admin_check(current_user: dict = Depends(require_role("admin"))):
    return {"message": f"Admin access granted for {current_user['full_name']}"}


@app.post("/api/students", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(payload: StudentCreate, current_user: dict = Depends(require_role("admin", "student"))):
    students = get_collection("students")
    users = get_collection("users")

    target_user_id = payload.user_id or current_user["id"]
    if current_user["role"] == "student" and target_user_id != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Students cannot create profiles for other users")

    if current_user["role"] not in {"admin", "student"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    user_doc = users.find_one({"_id": target_user_id})
    if not user_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Referenced user not found")

    normalized_email = payload.email.lower() if payload.email else user_doc["email"]
    if students.find_one({"user_id": target_user_id}):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Student profile already exists for this user")

    if students.find_one({"student_id": payload.student_id}):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Student ID already exists")

    if normalized_email and user_doc.get("email") and normalized_email != user_doc["email"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Student email must match the associated user email")

    now = datetime.utcnow()
    student_doc = {
        "_id": str(uuid.uuid4()),
        "user_id": target_user_id,
        "student_id": payload.student_id,
        "name": payload.name.strip(),
        "email": normalized_email,
        "department": payload.department.strip(),
        "year": payload.year,
        "created_at": now,
        "updated_at": now,
    }

    students.insert_one(student_doc)
    return StudentResponse(**_serialize_student(student_doc))


@app.get("/api/students", response_model=list[StudentResponse])
async def list_students(current_user: dict = Depends(require_role("admin", "reviewer", "student"))):
    students = get_collection("students")
    if current_user["role"] == "student":
        student_doc = students.find_one({"user_id": current_user["id"]})
        records = [student_doc] if student_doc else []
    else:
        records = list(students.find())
    return [StudentResponse(**_serialize_student(doc)) for doc in records]


@app.get("/api/students/{student_id}", response_model=StudentResponse)
async def get_student(student_id: str, current_user: dict = Depends(require_role("admin", "reviewer", "student"))):
    students = get_collection("students")
    student_doc = students.find_one({"_id": student_id})
    if not student_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    if current_user["role"] == "student" and student_doc["user_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return StudentResponse(**_serialize_student(student_doc))


@app.post("/api/exams", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
async def create_exam(payload: ExamCreate, current_user: dict = Depends(require_role("admin", "reviewer"))):
    exams = get_collection("exams")
    now = datetime.utcnow()
    exam_doc = {
        "_id": str(uuid.uuid4()),
        "name": payload.name.strip(),
        "subject": payload.subject.strip(),
        "description": payload.description.strip() if payload.description else None,
        "start_time": payload.start_time,
        "end_time": payload.end_time,
        "duration_minutes": payload.duration_minutes,
        "created_by": current_user["id"],
        "status": payload.status,
        "created_at": now,
        "updated_at": now,
    }
    exams.insert_one(exam_doc)
    return ExamResponse(**_serialize_exam(exam_doc))


@app.get("/api/exams", response_model=list[ExamResponse])
async def list_exams(current_user: dict = Depends(require_role("admin", "reviewer", "student"))):
    exams = get_collection("exams")
    exam_sessions = get_collection("exam_sessions")

    if current_user["role"] == "student":
        students = get_collection("students")
        student_doc = students.find_one({"user_id": current_user["id"]})
        if not student_doc:
            return []
        exam_ids = {record["exam_id"] for record in exam_sessions.find({"student_id": str(student_doc["_id"])})}
        records = list(exams.find({"_id": {"$in": list(exam_ids)}})) if exam_ids else []
    else:
        records = list(exams.find())
    return [ExamResponse(**_serialize_exam(doc)) for doc in records]


@app.get("/api/exams/{exam_id}", response_model=ExamResponse)
async def get_exam(exam_id: str, current_user: dict = Depends(require_role("admin", "reviewer", "student"))):
    exams = get_collection("exams")
    exam_doc = exams.find_one({"_id": exam_id})
    if not exam_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")

    if current_user["role"] == "student":
        students = get_collection("students")
        student_doc = students.find_one({"user_id": current_user["id"]})
        if not student_doc:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        session = get_collection("exam_sessions").find_one({"exam_id": exam_id, "student_id": str(student_doc["_id"])})
        if not session:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return ExamResponse(**_serialize_exam(exam_doc))


@app.put("/api/exams/{exam_id}", response_model=ExamResponse)
async def update_exam(exam_id: str, payload: ExamUpdate, current_user: dict = Depends(require_role("admin", "reviewer"))):
    exams = get_collection("exams")
    exam_doc = exams.find_one({"_id": exam_id})
    if not exam_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")

    update_data = {}
    if payload.name is not None:
        update_data["name"] = payload.name.strip()
    if payload.subject is not None:
        update_data["subject"] = payload.subject.strip()
    if payload.description is not None:
        update_data["description"] = payload.description.strip()
    if payload.start_time is not None:
        update_data["start_time"] = payload.start_time
    if payload.end_time is not None:
        update_data["end_time"] = payload.end_time
    if payload.duration_minutes is not None:
        update_data["duration_minutes"] = payload.duration_minutes
    if payload.status is not None:
        update_data["status"] = payload.status

    if update_data.get("start_time") is not None and update_data.get("end_time") is not None:
        if update_data["end_time"] <= update_data["start_time"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="end_time must be after start_time")
    elif update_data.get("start_time") is not None and exam_doc["end_time"] <= update_data["start_time"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="end_time must be after start_time")
    elif update_data.get("end_time") is not None and update_data["end_time"] <= exam_doc["start_time"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="end_time must be after start_time")

    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        exams.update_one({"_id": exam_id}, {"$set": update_data})

    updated_doc = exams.find_one({"_id": exam_id})
    return ExamResponse(**_serialize_exam(updated_doc))


@app.delete("/api/exams/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exam(exam_id: str, current_user: dict = Depends(require_role("admin"))):
    exams = get_collection("exams")
    exam_doc = exams.find_one({"_id": exam_id})
    if not exam_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")

    exams.delete_one({"_id": exam_id})
    get_collection("exam_sessions").delete_many({"exam_id": exam_id})
    return None


@app.post("/api/exams/{exam_id}/sessions", response_model=ExamSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_exam_session(exam_id: str, payload: ExamSessionCreate, current_user: dict = Depends(require_role("student"))):
    exams = get_collection("exams")
    students = get_collection("students")
    exam_sessions = get_collection("exam_sessions")

    exam_doc = exams.find_one({"_id": exam_id})
    if not exam_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")

    student_doc = students.find_one({"user_id": current_user["id"]})
    if not student_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")

    if payload.exam_id and payload.exam_id != exam_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session exam_id does not match route exam_id")
    if payload.student_id and payload.student_id != str(student_doc["_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Students can only create sessions for themselves")

    if exam_doc["status"] not in {"scheduled", "active"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Exam is not open for sessions")

    if exam_sessions.find_one({"exam_id": exam_id, "student_id": str(student_doc["_id"]), "status": {"$in": ["scheduled", "active"]}}):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Duplicate active session for this exam")

    now = datetime.utcnow()
    session_doc = {
        "_id": str(uuid.uuid4()),
        "exam_id": exam_id,
        "student_id": str(student_doc["_id"]),
        "started_at": payload.started_at or now,
        "ended_at": payload.ended_at,
        "status": payload.status,
        "integrity_score": payload.integrity_score,
        "created_at": now,
        "updated_at": now,
    }

    exam_sessions.insert_one(session_doc)
    return ExamSessionResponse(**_serialize_exam_session(session_doc))


@app.get("/api/exams/{exam_id}/sessions", response_model=list[ExamSessionResponse])
async def list_exam_sessions(exam_id: str, current_user: dict = Depends(require_role("admin", "reviewer", "student"))):
    exams = get_collection("exams")
    if not exams.find_one({"_id": exam_id}):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")

    exam_sessions = get_collection("exam_sessions")
    if current_user["role"] == "student":
        student_doc = get_collection("students").find_one({"user_id": current_user["id"]})
        if not student_doc:
            return []
        records = list(exam_sessions.find({"exam_id": exam_id, "student_id": str(student_doc["_id"])}))
    else:
        records = list(exam_sessions.find({"exam_id": exam_id}))
    return [ExamSessionResponse(**_serialize_exam_session(doc)) for doc in records]


@app.get("/api/sessions/{session_id}", response_model=ExamSessionResponse)
async def get_session(session_id: str, current_user: dict = Depends(require_role("admin", "reviewer", "student"))):
    exam_sessions = get_collection("exam_sessions")
    session_doc = exam_sessions.find_one({"_id": session_id})
    if not session_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if current_user["role"] == "student":
        student_doc = get_collection("students").find_one({"user_id": current_user["id"]})
        if not student_doc or session_doc["student_id"] != str(student_doc["_id"]):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return ExamSessionResponse(**_serialize_exam_session(session_doc))


@app.post("/upload", response_model=UploadResponse)
async def upload(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    job_id = str(uuid.uuid4())
    job_dir = UPLOADS_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    video_path = job_dir / file.filename

    with video_path.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    _status_path(job_id).write_text(
        json.dumps({"job_id": job_id, "status": "processing", "progress": 0})
    )

    background_tasks.add_task(run_pipeline_job, job_id, video_path)
    return {"job_id": job_id, "status": "processing"}


@app.get("/status/{job_id}", response_model=StatusResponse)
async def get_status(job_id: str):
    path = _status_path(job_id)
    if not path.exists():
        raise HTTPException(status_code=404, detail="job not found")
    return json.loads(path.read_text())


@app.get("/results/{job_id}")
async def get_results(job_id: str):
    path = _results_path(job_id)
    if not path.exists():
        status_path = _status_path(job_id)
        if status_path.exists():
            status = json.loads(status_path.read_text())
            if status["status"] != "done":
                raise HTTPException(status_code=409, detail=f"job status is '{status['status']}', not ready")
        raise HTTPException(status_code=404, detail="results not found")

    results = json.loads(path.read_text())

    review_path = REVIEWS_DIR / f"{job_id}.json"
    if review_path.exists():
        reviews = json.loads(review_path.read_text())
        for ev in results.get("events", []):
            if ev["event_id"] in reviews:
                ev["review"] = reviews[ev["event_id"]]

    return results


@app.get("/snapshot/{job_id}/{filename}")
async def get_snapshot(job_id: str, filename: str):
    path = SNAPSHOTS_DIR / job_id / filename
    if not path.exists():
        ref_filename = filename.replace(".jpg", "_ref.jpg")
        ref_path = SNAPSHOTS_DIR / job_id / ref_filename
        if ref_path.exists():
            return FileResponse(ref_path)
        raise HTTPException(status_code=404, detail="snapshot not found")
    return FileResponse(path)


@app.get("/api/snapshots/{video_name}/{type}/{filename}")
async def get_api_snapshot(video_name: str, type: str, filename: str):
    base_snapshots_dir = BASE_DIR.parent.parent / "AI-ML" / "data" / "snapshots"
    path = base_snapshots_dir / video_name / type / filename
    
    if not path.exists():
        if type == "annotated":
            ref_path = base_snapshots_dir / video_name / "reference" / filename
            if ref_path.exists():
                return FileResponse(ref_path)
        raise HTTPException(status_code=404, detail="snapshot not found")
        
    return FileResponse(path)


@app.post("/events/{job_id}/{event_id}/review", response_model=ReviewResponse)
async def review_event(job_id: str, event_id: str, body: ReviewRequest):
    results_path = _results_path(job_id)
    if not results_path.exists():
        raise HTTPException(status_code=404, detail="job not found")

    review_path = REVIEWS_DIR / f"{job_id}.json"
    reviews = json.loads(review_path.read_text()) if review_path.exists() else {}
    reviews[event_id] = body.decision
    review_path.write_text(json.dumps(reviews))

    return {"event_id": event_id, "decision": body.decision, "status": "saved"}


@app.get("/heatmap/{job_id}", response_model=HeatmapResponse)
async def get_heatmap(job_id: str):
    results_path = _results_path(job_id)
    if not results_path.exists():
        raise HTTPException(status_code=404, detail="job not found")

    results = json.loads(results_path.read_text())
    zone_map: dict[int, ZoneHeat] = {}
    for ev in results.get("events", []):
        zid = ev["zone_id"]
        if zid not in zone_map:
            zone_map[zid] = ZoneHeat(zone_id=zid, total_intensity=0.0, event_count=0)
        zone_map[zid].total_intensity += ev.get("motion_intensity", 0.0)
        zone_map[zid].event_count += 1

    return {"zones": list(zone_map.values())}


@app.get("/")
async def root():
    return {"status": "ExamVision AI backend running"}
