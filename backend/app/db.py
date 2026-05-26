from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status
import bcrypt
from .schemas import AuthMeResponse, AuthResponse, LoginRequest, RegisterRequest
from .security import create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


def hash_password(password: str) -> str:
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
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id FROM users WHERE email = %s", (payload.email.lower(),)
            )
            if cur.fetchone():
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered.")

            password_hash = hash_password(payload.password)
            cur.execute(
                "INSERT INTO users (email, password_hash) VALUES (%s, %s) RETURNING id",
                (payload.email.lower(), password_hash),
            )
            row = cur.fetchone()
            user_id = int(row["id"])

    token = create_access_token(subject=str(user_id))
    return AuthResponse(access_token=token, token_type="bearer")


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest) -> AuthResponse:
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, password_hash FROM users WHERE email = %s",
                (payload.email.lower(),),
            )
            row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")
    if not verify_password(payload.password, row["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")

    token = create_access_token(subject=str(row["id"]))
    return AuthResponse(access_token=token, token_type="bearer")


@router.get("/me", response_model=AuthMeResponse)
async def me(user: dict = Depends(get_current_user)) -> AuthMeResponse:
    return AuthMeResponse(id=int(user["id"]), email=str(user["email"]), created_at=str(user["created_at"]))
