from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).resolve().parent / "data.db"


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS holdings (
            symbol TEXT PRIMARY KEY,
            name TEXT,
            quantity REAL DEFAULT 0,
            earnings_url TEXT
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS earnings_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT NOT NULL,
            report_url TEXT NOT NULL,
            summary TEXT,
            revenue_signal TEXT,
            eps_signal TEXT,
            guidance_signal TEXT,
            margin_signal TEXT,
            fetched_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.commit()
    conn.close()


def upsert_holding(symbol: str, name: str | None, quantity: float, earnings_url: str | None) -> None:
    conn = get_conn()
    conn.execute(
        """
        INSERT INTO holdings(symbol, name, quantity, earnings_url)
        VALUES(?, ?, ?, ?)
        ON CONFLICT(symbol) DO UPDATE SET
          name=excluded.name,
          quantity=excluded.quantity,
          earnings_url=excluded.earnings_url
        """,
        (symbol.upper(), name, quantity, earnings_url),
    )
    conn.commit()
    conn.close()


def list_holdings() -> list[dict[str, Any]]:
    conn = get_conn()
    rows = conn.execute("SELECT symbol, name, quantity, earnings_url FROM holdings ORDER BY symbol").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def insert_earnings_result(symbol: str, report_url: str, analysis: dict[str, Any]) -> None:
    signals = analysis.get("signals", {})
    conn = get_conn()
    conn.execute(
        """
        INSERT INTO earnings_reports(symbol, report_url, summary, revenue_signal, eps_signal, guidance_signal, margin_signal)
        VALUES(?, ?, ?, ?, ?, ?, ?)
        """,
        (
            symbol.upper(),
            report_url,
            analysis.get("summary"),
            signals.get("revenue"),
            signals.get("eps"),
            signals.get("guidance"),
            signals.get("margin"),
        ),
    )
    conn.commit()
    conn.close()


def list_recent_earnings(limit: int = 20) -> list[dict[str, Any]]:
    conn = get_conn()
    rows = conn.execute(
        """
        SELECT id, symbol, report_url, summary, revenue_signal, eps_signal, guidance_signal, margin_signal, fetched_at
        FROM earnings_reports
        ORDER BY id DESC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]
