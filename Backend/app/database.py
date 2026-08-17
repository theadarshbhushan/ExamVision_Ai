from datetime import datetime
from typing import Optional

from pymongo import MongoClient
from pymongo.database import Database

from app.config import MONGO_DB_NAME, MONGO_URI

client: Optional[MongoClient] = None
db: Optional[Database] = None


def get_database() -> Database:
    global client, db

    if db is not None:
        return db

    if not MONGO_URI or not MONGO_DB_NAME:
        raise RuntimeError("MongoDB configuration is incomplete. Check MONGO_URI and MONGO_DB_NAME in Backend/.env.")

    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client[MONGO_DB_NAME]

    try:
        client.admin.command("ping")
    except Exception as exc:
        client.close()
        client = None
        db = None
        raise RuntimeError(
            f"MongoDB connection failed. Start MongoDB or update MONGO_URI in Backend/.env. "
            f"Configured URI: {MONGO_URI}"
        ) from exc

    return db


def close_database():
    global client, db
    if client is not None:
        client.close()
    client = None
    db = None


def get_collection(collection_name: str):
    return get_database()[collection_name]


def initialize_database():
    database = get_database()
    users = database["users"]
    users.create_index("email", unique=True, name="unique_email")

    roles = database["roles"]
    roles.create_index("name", unique=True, name="unique_role_name")

    students = database["students"]
    students.create_index("student_id", unique=True, name="unique_student_id")
    students.create_index("user_id", unique=True, name="unique_student_user_id")

    exams = database["exams"]
    exams.create_index("created_by", name="exam_created_by_index")
    exams.create_index([("start_time", 1), ("end_time", 1)], name="exam_time_index")

    exam_sessions = database["exam_sessions"]
    exam_sessions.create_index([("exam_id", 1), ("student_id", 1)], name="exam_student_lookup_index")
    exam_sessions.create_index(
        [("exam_id", 1), ("student_id", 1), ("status", 1)],
        name="unique_active_exam_student_session",
        unique=True,
        partialFilterExpression={"status": {"$in": ["scheduled", "active"]}},
    )

    default_roles = ["admin", "reviewer", "student"]
    for role_name in default_roles:
        roles.update_one(
            {"name": role_name},
            {"$setOnInsert": {"name": role_name, "created_at": datetime.utcnow()}},
            upsert=True,
        )

    return database
