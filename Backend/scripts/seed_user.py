import sys
import os
import uuid
from datetime import datetime

# Add Backend root directory to import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.auth import hash_password
from app.database import get_collection

def seed():
    users = get_collection("users")
    email = "reviewer@examvision.demo"
    
    existing = users.find_one({"email": email})
    if existing:
        print(f"User {email} already exists in database.")
        return

    password = "password123"
    user_doc = {
        "_id": str(uuid.uuid4()),
        "email": email,
        "password_hash": hash_password(password),
        "full_name": "Demo Reviewer",
        "role": "reviewer",
        "is_active": True,
        "created_at": datetime.utcnow(),
    }
    
    users.insert_one(user_doc)
    print(f"Successfully seeded user: {email}")
    print(f"Plaintext Password: {password}")
    print(f"Hashed Password: {user_doc['password_hash']}")

if __name__ == "__main__":
    seed()
