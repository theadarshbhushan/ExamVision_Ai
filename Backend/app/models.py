from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


class StudentBase(BaseModel):
    student_id: str = Field(min_length=3, max_length=80)
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    department: str = Field(min_length=1, max_length=255)
    year: int = Field(ge=1, le=12)


class StudentCreate(StudentBase):
    user_id: Optional[str] = None


class StudentResponse(StudentBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime


class ExamBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    subject: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    duration_minutes: int = Field(gt=0)
    status: Literal["draft", "scheduled", "active", "completed", "cancelled"] = "draft"

    @model_validator(mode="after")
    def validate_exam_window(self):
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


class ExamCreate(ExamBase):
    pass


class ExamUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    subject: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(default=None, gt=0)
    status: Optional[Literal["draft", "scheduled", "active", "completed", "cancelled"]] = None

    @model_validator(mode="after")
    def validate_updated_times(self):
        start_time = self.start_time
        end_time = self.end_time
        duration_minutes = self.duration_minutes

        if start_time is not None and end_time is not None and end_time <= start_time:
            raise ValueError("end_time must be after start_time")
        if duration_minutes is not None and duration_minutes <= 0:
            raise ValueError("duration_minutes must be positive")
        return self


class ExamResponse(ExamBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_by: str
    created_at: datetime
    updated_at: datetime


class ExamSessionBase(BaseModel):
    exam_id: str
    student_id: str
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    status: Literal["scheduled", "active", "completed", "cancelled"] = "scheduled"
    integrity_score: Optional[float] = Field(default=None, ge=0, le=100)

    @model_validator(mode="after")
    def validate_session_state(self):
        if self.started_at is not None and self.ended_at is not None and self.ended_at < self.started_at:
            raise ValueError("ended_at must be after started_at")
        return self


class ExamSessionCreate(ExamSessionBase):
    pass


class ExamSessionUpdate(BaseModel):
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    status: Optional[Literal["scheduled", "active", "completed", "cancelled"]] = None
    integrity_score: Optional[float] = Field(default=None, ge=0, le=100)

    @model_validator(mode="after")
    def validate_updated_state(self):
        started_at = self.started_at
        ended_at = self.ended_at
        if started_at is not None and ended_at is not None and ended_at < started_at:
            raise ValueError("ended_at must be after started_at")
        return self


class ExamSessionResponse(ExamSessionBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime


class UploadResponse(BaseModel):
    job_id: str
    status: Literal["processing"]


class StatusResponse(BaseModel):
    job_id: str
    status: Literal["processing", "done", "failed"]
    progress: int  # 0-100
    error: Optional[str] = None


class Detection(BaseModel):
    class_name: str
    confidence: float
    bounding_box: list[float]  # [x1, y1, x2, y2]


class Event(BaseModel):
    event_id: str
    start_time: float
    end_time: float
    zone_id: int
    motion_intensity: float
    detections: list[Detection] = []
    before_snapshot_url: Optional[str] = None
    after_snapshot_url: Optional[str] = None
    annotated_snapshot_url: Optional[str] = None
    review: Optional[Literal["approve", "dismiss"]] = None


class ResultsResponse(BaseModel):
    video_name: str
    total_frames: int
    frames_sent_to_yolo: int
    bypass_ratio: float
    events: list[Event]


class ReviewRequest(BaseModel):
    decision: Literal["approve", "dismiss"]


class ReviewResponse(BaseModel):
    event_id: str
    decision: str
    status: Literal["saved"]


class ZoneHeat(BaseModel):
    zone_id: int
    total_intensity: float
    event_count: int


class HeatmapResponse(BaseModel):
    zones: list[ZoneHeat]


class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=255)
    role: Literal["admin", "reviewer", "student"] = "student"


class UserRegisterRequest(UserBase):
    password: str = Field(min_length=8)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class UserCreate(UserBase):
    password_hash: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    full_name: str
    role: Literal["admin", "reviewer", "student"]
    is_active: bool
    created_at: datetime


class UserAuthResponse(BaseModel):
    user: UserResponse


class TokenResponse(BaseModel):
    message: str


class AuthErrorResponse(BaseModel):
    detail: str
