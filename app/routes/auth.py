from datetime import datetime
import sqlite3

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from app.auth.security import create_token, hash_password, verify_password
from app.config import settings

router = APIRouter()

# Reuse the same DB file as the rest of the app (see db/init_db.py)
DB = "sla_logs.db"


def _conn():
  conn = sqlite3.connect(DB)
  conn.row_factory = sqlite3.Row
  return conn


class LoginBody(BaseModel):
  email: EmailStr
  password: str


class RegisterBody(BaseModel):
  email: EmailStr
  password: str
  role: str = "operator"  # admin | operator | viewer
  signup_key: str | None = None


@router.post("/auth/register")
def register(body: RegisterBody):
  # Optional guard: if SIGNUP_KEY is set, require it to match for any registration
  expected_key = settings.SIGNUP_KEY
  if expected_key:
    if not body.signup_key or body.signup_key != expected_key:
      raise HTTPException(status_code=403, detail="Invalid signup key")

  with _conn() as conn:
    try:
      conn.execute(
        """
        INSERT INTO users (email, password_hash, role, created_at)
        VALUES (?, ?, ?, ?)
        """,
        (
          body.email,
          hash_password(body.password),
          body.role,
          datetime.utcnow().isoformat(),
        ),
      )
      conn.commit()
    except sqlite3.IntegrityError:
      raise HTTPException(status_code=400, detail="Email already exists")

  return {"ok": True}


@router.post("/auth/login")
def login(body: LoginBody):
  with _conn() as conn:
    user = conn.execute(
      "SELECT id, email, password_hash, role FROM users WHERE email = ?",
      (body.email,),
    ).fetchone()

  if not user or not verify_password(body.password, user["password_hash"]):
    raise HTTPException(status_code=401, detail="Invalid credentials")

  token = create_token(
    {
      "user_id": user["id"],
      "email": user["email"],
      "role": user["role"],
    }
  )

  return {"access_token": token, "role": user["role"], "email": user["email"]}


