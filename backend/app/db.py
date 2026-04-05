from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator


DB_PATH = Path(__file__).resolve().parents[2] / "data" / "bdip_app.db"


@contextmanager
def get_db() -> Iterator[sqlite3.Connection]:
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
        # Decision tracking table
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS decision_log (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              recommendation_id TEXT NOT NULL,
              action TEXT NOT NULL,
              status TEXT NOT NULL DEFAULT 'approved',
              expected_outcome TEXT,
              actual_result TEXT,
              created_at TEXT NOT NULL DEFAULT (datetime('now')),
              resolved_at TEXT,
              FOREIGN KEY(user_id) REFERENCES users(id)
            )
            """
        )
        # Uploaded events table (append-only, timestamped)
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS uploaded_events (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              session_id TEXT NOT NULL,
              user_id TEXT NOT NULL,
              timestamp TEXT NOT NULL,
              page TEXT NOT NULL,
              event_type TEXT NOT NULL,
              device TEXT NOT NULL,
              source TEXT NOT NULL,
              amount REAL DEFAULT 0.0,
              converted INTEGER DEFAULT 0,
              ingested_at TEXT NOT NULL DEFAULT (datetime('now')),
              UNIQUE(session_id, event_type, timestamp)
            )
            """
        )
        conn.commit()
