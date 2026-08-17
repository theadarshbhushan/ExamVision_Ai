from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi import HTTPException

from app.auth import (
    create_access_token,
    decode_access_token,
    hash_password,
    require_role,
    serialize_user,
    verify_password,
)
from app.config import JWT_ALGORITHM, JWT_SECRET


def test_password_hash_and_verify():
    raw_password = "StrongPass123!"
    hashed = hash_password(raw_password)

    assert hashed != raw_password
    assert verify_password(raw_password, hashed) is True
    assert verify_password("wrong-password", hashed) is False


def test_access_token_round_trip():
    token = create_access_token("user-123")
    payload = decode_access_token(token)

    assert payload["sub"] == "user-123"
    assert payload["exp"] > datetime.now(timezone.utc).timestamp()


def test_decode_access_token_rejects_expired_token():
    expired_payload = {
        "sub": "user-123",
        "iat": datetime.now(timezone.utc) - timedelta(minutes=10),
        "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
    }
    expired_token = jwt.encode(expired_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(expired_token)

    assert exc_info.value.status_code == 401
    assert "expired" in exc_info.value.detail.lower()


def test_serialize_user_removes_password_and_sets_id():
    user = {
        "_id": "abc123",
        "email": "user@example.com",
        "full_name": "Example User",
        "role": "admin",
        "password_hash": "hashed-secret",
        "is_active": True,
        "created_at": datetime(2024, 1, 1, 12, 0, tzinfo=timezone.utc),
    }

    serialized = serialize_user(user)

    assert serialized["id"] == "abc123"
    assert "password_hash" not in serialized
    assert serialized["created_at"] == "2024-01-01T12:00:00+00:00"


def test_require_role_rejects_unauthorized_roles():
    dependency = require_role("admin")

    with pytest.raises(HTTPException) as exc_info:
        import asyncio

        asyncio.run(dependency({"role": "student"}))

    assert exc_info.value.status_code == 403
    assert "permission" in exc_info.value.detail.lower()
