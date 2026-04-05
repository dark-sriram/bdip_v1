from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response

from .db import get_db
from .schemas import (
    DecisionApproveRequest,
    DecisionLogEntry,
    DecisionRejectRequest,
    DecisionUpdateRequest,
)
from .security import get_current_user

router = APIRouter(prefix="/decisions", tags=["decision_tracking"])


@router.post("/approve", response_model=DecisionLogEntry)
def approve_decision(
    payload: DecisionApproveRequest,
    user: dict = Depends(get_current_user),
) -> DecisionLogEntry:
    with get_db() as conn:
        cur = conn.execute(
            """
            INSERT INTO decision_log (user_id, recommendation_id, action, status, expected_outcome)
            VALUES (?, ?, ?, 'approved', ?)
            """,
            (
                user["id"],
                payload.recommendation_id,
                payload.action,
                payload.expected_outcome,
            ),
        )
        row_id = cur.lastrowid
        row = conn.execute(
            "SELECT * FROM decision_log WHERE id = ?", (row_id,)
        ).fetchone()
    return DecisionLogEntry(**dict(row))


@router.post("/reject", response_model=DecisionLogEntry)
def reject_decision(
    payload: DecisionRejectRequest,
    user: dict = Depends(get_current_user),
) -> DecisionLogEntry:
    action = payload.reason or "Decision rejected by user."
    with get_db() as conn:
        cur = conn.execute(
            """
            INSERT INTO decision_log (user_id, recommendation_id, action, status)
            VALUES (?, ?, ?, 'rejected')
            """,
            (user["id"], payload.recommendation_id, action),
        )
        row_id = cur.lastrowid
        row = conn.execute(
            "SELECT * FROM decision_log WHERE id = ?", (row_id,)
        ).fetchone()
    return DecisionLogEntry(**dict(row))


@router.get("/history", response_model=list[DecisionLogEntry])
def get_decision_history(
    user: dict = Depends(get_current_user),
) -> list[DecisionLogEntry]:
    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT * FROM decision_log
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 100
            """,
            (user["id"],),
        ).fetchall()
    return [DecisionLogEntry(**dict(r)) for r in rows]


@router.patch("/{decision_id}/outcome", response_model=DecisionLogEntry)
def update_actual_outcome(
    decision_id: int,
    payload: DecisionUpdateRequest,
    user: dict = Depends(get_current_user),
) -> DecisionLogEntry:
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM decision_log WHERE id = ? AND user_id = ?",
            (decision_id, user["id"]),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Decision not found.")
        conn.execute(
            """
            UPDATE decision_log
            SET actual_result = ?, resolved_at = datetime('now')
            WHERE id = ?
            """,
            (payload.actual_result, decision_id),
        )
        updated = conn.execute(
            "SELECT * FROM decision_log WHERE id = ?", (decision_id,)
        ).fetchone()
    return DecisionLogEntry(**dict(updated))


@router.delete("/{decision_id}")
def delete_decision(
    decision_id: int,
    user: dict = Depends(get_current_user),
) -> Response:
    with get_db() as conn:
        row = conn.execute(
            "SELECT id FROM decision_log WHERE id = ? AND user_id = ?",
            (decision_id, user["id"]),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Decision not found.")
        conn.execute("DELETE FROM decision_log WHERE id = ?", (decision_id,))
    return Response(status_code=204)
