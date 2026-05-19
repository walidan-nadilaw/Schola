import sys
import os

# Add current path to import app correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import User
from app.services.submission_service import SubmissionService

db = SessionLocal()
try:
    print("=== SIMULATING USER 2 LIST ===")
    user2 = db.query(User).filter(User.email == "user2@apps.ipb.ac.id").first()
    print(f"Logged in user: {user2.name} | ID: {user2.id} | Role: {user2.role}")

    svc = SubmissionService(db)
    res = svc.list_paginated(user2)
    print(f"Total items returned: {res.pagination.totalItems}")
    for item in res.data:
        print(f"Returned Sub ID: {item.id} | Submitter: {item.submitter.name} ({item.submitter.id})")
finally:
    db.close()
