"""API tests: the HTTP surface behaves like the engine and honours idempotency."""

from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

TXNS = [
    {"date": "2026-05-03", "description": "SALARY CREDIT - INFOSYS LTD", "amount": 44800, "type": "credit", "balance": 86762},
    {"date": "2026-05-07", "description": "EMI BAJAJ FINANCE", "amount": 8500, "type": "debit", "balance": 78262},
    {"date": "2026-06-03", "description": "SALARY CREDIT - INFOSYS LTD", "amount": 44900, "type": "credit", "balance": 114662},
    {"date": "2026-06-07", "description": "EMI BAJAJ FINANCE", "amount": 8500, "type": "debit", "balance": 106162},
    {"date": "2026-07-03", "description": "SALARY CREDIT - INFOSYS LTD", "amount": 44750, "type": "credit", "balance": 150412},
    {"date": "2026-07-07", "description": "EMI BAJAJ FINANCE", "amount": 8500, "type": "debit", "balance": 141912},
]


def test_health_and_ready() -> None:
    assert client.get("/health").json()["status"] == "ok"
    ready = client.get("/readyz").json()
    assert ready["ready"] is True
    assert ready["cache"] in {"memory", "redis"}


def test_openapi_is_published() -> None:
    spec = client.get("/openapi.json").json()
    assert spec["info"]["title"] == "Gavel Decision Service"
    assert "/v1/underwriting/evaluate" in spec["paths"]


def test_evaluate_returns_a_decision() -> None:
    res = client.post("/v1/underwriting/evaluate", json={"transactions": TXNS, "period": "3 months"})
    assert res.status_code == 200
    body = res.json()
    assert body["decision"] in {"APPROVE", "REVIEW", "REJECT"}
    assert body["rules_fired"]
    assert body["audit_id"].startswith("gavel_")
    assert body["signals"]["monthly_income"] > 0


def test_insufficient_history_is_rejected() -> None:
    res = client.post("/v1/underwriting/evaluate", json={"transactions": TXNS[:2]})
    body = res.json()
    assert body["decision"] == "REJECT"
    assert body["error"]["code"] == "E001"


def test_idempotency_replays_then_conflicts() -> None:
    headers = {"Idempotency-Key": "test-key-1"}
    first = client.post("/v1/underwriting/evaluate", json={"transactions": TXNS, "period": "3 months"}, headers=headers)
    second = client.post("/v1/underwriting/evaluate", json={"transactions": TXNS, "period": "3 months"}, headers=headers)
    assert first.json()["audit_id"] == second.json()["audit_id"]

    third = client.post(
        "/v1/underwriting/evaluate",
        json={"transactions": TXNS[:2], "period": "1 months"},
        headers={"Idempotency-Key": "test-key-1"},
    )
    assert third.status_code == 409


def test_parse_endpoint() -> None:
    text = "03/05/2026 SALARY CREDIT - INFOSYS LTD 44,762.00 86,762.00 Cr"
    res = client.post("/v1/parse/statement", json={"text": text})
    body = res.json()
    assert len(body["transactions"]) == 1
    assert body["transactions"][0]["type"] == "credit"


def test_explain_falls_back_without_a_key() -> None:
    res = client.post("/v1/ai/explain", json={"transactions": TXNS, "period": "3 months", "applicant_id": "apl-1"})
    body = res.json()
    assert body["source"] in {"gemini", "deterministic-template"}
    assert body["decision"] in {"APPROVE", "REVIEW", "REJECT"}
    assert len(body["note"]) > 40


def test_api_key_is_enforced_when_configured(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("GAVEL_API_KEY", "secret-test-key")
    assert client.post("/v1/underwriting/evaluate", json={"transactions": TXNS}).status_code == 401
    ok = client.post(
        "/v1/underwriting/evaluate",
        json={"transactions": TXNS, "period": "3 months"},
        headers={"Authorization": "Bearer secret-test-key"},
    )
    assert ok.status_code == 200
