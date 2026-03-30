from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from .db import get_db


JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_SECRET = os.getenv("JWT_SECRET", "CHANGE_ME_SUPER_SECRET_FOR_DEMO_ONLY")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def create_access_token(*, subject: str, expires_minutes: Optional[int] = None) -> str:
    expire_minutes = expires_minutes or ACCESS_TOKEN_EXPIRE_MINUTES
    expire = datetime.now(timezone.utc) + timedelta(minutes=expire_minutes)
    payload: dict[str, Any] = {
        "sub": subject,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_token_subject(token_payload: dict[str, Any]) -> str:
    subject = token_payload.get("sub")
    if not subject:
        raise ValueError("Missing subject claim")
    return str(subject)


async def get_current_user(request: Request, token: str = Depends(oauth2_scheme)) -> dict[str, Any]:
    """
    Validate JWT and return the user row as a dict.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        subject = get_token_subject(payload)
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )

    # subject is user id (email would also work)
    from .db import get_db  # local import to avoid cycles

    with get_db() as conn:
        row = conn.execute("SELECT id, email, created_at FROM users WHERE id = ?", (subject,)).fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found for token.",
        )

    return dict(row)

