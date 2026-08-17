import pytest
from pydantic import ValidationError

from app.auth import require_role
from app.models import ExamCreate, ExamSessionCreate, StudentCreate


def test_student_create_validates_required_fields():
    student = StudentCreate(
        user_id="user-1",
        student_id="S-1001",
        name="Ada Lovelace",
        email="ada@example.com",
        department="Computer Science",
        year=2,
    )

    assert student.student_id == "S-1001"
    assert student.email == "ada@example.com"


def test_exam_create_rejects_invalid_duration_and_time_range():
    with pytest.raises(ValidationError):
        ExamCreate(
            name="Math Exam",
            subject="Mathematics",
            description="Exam",
            start_time="2026-01-10T09:00:00",
            end_time="2026-01-10T08:30:00",
            duration_minutes=0,
            status="scheduled",
        )


def test_exam_session_integrity_score_bounds():
    with pytest.raises(ValidationError):
        ExamSessionCreate(
            exam_id="exam-1",
            student_id="student-1",
            started_at="2026-01-10T09:00:00",
            ended_at="2026-01-10T09:30:00",
            status="active",
            integrity_score=120,
        )


def test_require_role_rejects_unauthorized_access():
    dependency = require_role("admin")

    import asyncio

    with pytest.raises(Exception):
        asyncio.run(dependency({"role": "student"}))
