from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

import bcrypt

from .db import get_db
from .schemas import AuthMeResponse, AuthResponse, LoginRequest, RegisterRequest
from .security import create_access_token, get_current_user


router = APIRouter(prefix="/auth", tags=["auth"])


def hash_password(password: str) -> str:
    # bcrypt only truncates extremely long passwords; for demo we assume typical lengths.
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(
        password.encode("utf-8"), password_hash.encode("utf-8")
    )


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest) -> AuthResponse:
    with get_db() as conn:
        existing = conn.execute(
            "SELECT id FROM users WHERE email = ?", (payload.email.lower(),)
        ).fetchone()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered.")

        password_hash = hash_password(payload.password)
        cur = conn.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            (payload.email.lower(), password_hash),
        )
        user_id = int(cur.lastrowid)

    token = create_access_token(subject=str(user_id))
    return AuthResponse(access_token=token, token_type="bearer")


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest) -> AuthResponse:
    with get_db() as conn:
        row = conn.execute(
            "SELECT id, password_hash FROM users WHERE email = ?",
            (payload.email.lower(),),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")

        if not verify_password(payload.password, row["password_hash"]):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")

        user_id = int(row["id"])

    token = create_access_token(subject=str(user_id))
    return AuthResponse(access_token=token, token_type="bearer")


@router.get("/me", response_model=AuthMeResponse)
async def me(user: dict = Depends(get_current_user)) -> AuthMeResponse:
    return AuthMeResponse(id=int(user["id"]), email=str(user["email"]), created_at=str(user["created_at"]))

