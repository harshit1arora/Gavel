"""Vision parsing: normalisation and validation, without network calls.

The model is only allowed to transcribe. These tests pin the contract: bad rows
are rejected, not passed through, and confidence reflects what survived.
"""

from __future__ import annotations

import pytest

from app.vision import _iso_date, normalise


def test_iso_date_accepts_the_formats_indian_statements_use() -> None:
    assert _iso_date("2026-04-03") == "2026-04-03"
    assert _iso_date("03/04/2026") == "2026-04-03"
    assert _iso_date("3-4-26") == "2026-04-03"
    assert _iso_date("31/12/2025") == "2025-12-31"
    # day/month swapped when the month cannot be > 12
    assert _iso_date("04/13/2026") == "2026-04-13"
    assert _iso_date("not a date") is None


def test_normalise_keeps_good_rows_and_reports_bad_ones() -> None:
    payload = {
        "bank": "Punjab National Bank",
        "period": "Apr to Jun 2026",
        "handwritten": True,
        "notes": "",
        "transactions": [
            {"date": "03/04/2026", "description": "SALARY CREDIT", "amount": 44800, "type": "credit", "balance": 86762, "confidence": 0.95},
            {"date": "2026-04-07", "description": "EMI BAJAJ", "amount": "8500", "type": "debit", "confidence": 0.9},
            {"date": "", "description": "no date", "amount": 100, "type": "debit"},
            {"date": "2026-04-09", "description": "bad type", "amount": 100, "type": "transfer"},
            {"date": "2026-04-10", "description": "zero amount", "amount": 0, "type": "debit"},
        ],
    }

    result = normalise(payload, "gemini-2.5-flash")

    assert len(result.transactions) == 2
    assert len(result.rejected_rows) == 3
    assert result.transactions[0].date == "2026-04-03"
    assert result.transactions[0].amount == 44800
    assert result.transactions[1].amount == 8500  # string amount coerced
    assert result.handwritten is True
    assert result.bank == "Punjab National Bank"
    assert result.method == "gemini-2.5-flash-vision"
    assert 0.5 < result.confidence <= 0.99


def test_normalise_deduplicates_repeated_rows() -> None:
    row = {"date": "2026-04-03", "description": "SALARY", "amount": 1000, "type": "credit"}
    result = normalise({"transactions": [row, dict(row)]}, "gemini-2.5-flash")
    assert len(result.transactions) == 1


def test_normalise_sorts_by_date() -> None:
    result = normalise(
        {
            "transactions": [
                {"date": "2026-05-01", "description": "b", "amount": 2, "type": "debit"},
                {"date": "2026-04-01", "description": "a", "amount": 1, "type": "credit"},
            ]
        },
        "gemini-2.5-flash",
    )
    assert [t.date for t in result.transactions] == ["2026-04-01", "2026-05-01"]


def test_empty_page_returns_zero_confidence() -> None:
    result = normalise({"transactions": [], "notes": "blank page"}, "gemini-2.5-flash")
    assert result.transactions == []
    assert result.confidence == 0.0
    assert result.notes == "blank page"


def test_negative_amounts_are_stored_as_positive_with_direction() -> None:
    result = normalise(
        {"transactions": [{"date": "2026-04-03", "description": "EMI", "amount": -8500, "type": "debit"}]},
        "gemini-2.5-flash",
    )
    assert result.transactions[0].amount == 8500
    assert result.transactions[0].type == "debit"


@pytest.mark.skipif(not __import__("os").environ.get("GEMINI_API_KEY"), reason="needs a live key")
def test_live_vision_round_trip() -> None:
    """Opt-in smoke test against the real API. Never runs in CI without a key."""
    import asyncio
    from pathlib import Path

    from app.vision import extract_transactions

    sample = Path(__file__).parent / "fixtures" / "statement-handwritten.png"
    if not sample.exists():
        pytest.skip("fixture missing")

    result = asyncio.run(extract_transactions(sample.read_bytes(), "image/png"))
    assert len(result.transactions) >= 4
    assert result.confidence > 0.5
