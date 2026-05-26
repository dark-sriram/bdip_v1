from __future__ import annotations
import os
from contextlib import contextmanager
from typing import Iterator

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL and DATABASE_URL.startswith("postgresql"):
    # ── Production: PostgreSQL (Supabase) ────────────────
    import psycopg2
    import psycopg2.extras

    @contextmanager
    def get_db():
        conn = psycopg2.connect(DATABASE_URL,sslmode="require")
        conn.autocommit = False
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def init_db():
        pass  # Tables created manually in Supabase SQL Editor

else:
    # ── Development: SQLite (local) ───────────────────────
    import sqlite3
    from pathlib import Path

    DB_PATH = Path(__file__).resolve().parents[2] / "data" / "bdip_app.db"

    @contextmanager
    def get_db():
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

    def init_db():
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  email TEXT UNIQUE NOT NULL,
                  password_hash TEXT NOT NULL,
                  created_at TEXT NOT NULL DEFAULT (datetime('now'))
                )""")
            conn.execute("""
                CREATE TABLE IF NOT EXISTS decision_log (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER NOT NULL,
                  recommendation_id TEXT NOT NULL,
                  action TEXT NOT NULL,
                  status TEXT NOT NULL DEFAULT 'approved',
                  expected_outcome TEXT,
                  actual_result TEXT,
                  created_at TEXT NOT NULL DEFAULT (datetime('now')),
                  resolved_at TEXT
                )""")
            conn.execute("""
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
                  ingested_at TEXT DEFAULT (datetime('now')),
                  UNIQUE(session_id, event_type, timestamp)
                )""")
            conn.execute("""
                CREATE TABLE IF NOT EXISTS marketplace_orders (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER NOT NULL,
                  platform TEXT NOT NULL,
                  product_id TEXT NOT NULL,
                  product_name TEXT,
                  order_id TEXT NOT NULL,
                  date TEXT NOT NULL,
                  selling_price REAL NOT NULL,
                  platform_fee REAL DEFAULT 0,
                  shipping_cost REAL DEFAULT 0,
                  cogs REAL DEFAULT 0,
                  quantity INTEGER DEFAULT 1,
                  return_flag INTEGER DEFAULT 0,
                  rating REAL DEFAULT 0,
                  ingested_at TEXT DEFAULT (datetime('now')),
                  UNIQUE(user_id, order_id, platform)
                )""")
            conn.commit()
