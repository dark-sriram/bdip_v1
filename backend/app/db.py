from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator


DB_PATH = Path(__file__).resolve().parents[2] / "data" / "bdip_app.db"


@contextmanager
def get_db() -> Iterator[sqlite3.Connection]:
    """
    Provide a SQLite connection per request.
    In production, move to a proper DB + connection pool.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              email TEXT UNIQUE NOT NULL,
              password_hash TEXT NOT NULL,
              created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """
        )

