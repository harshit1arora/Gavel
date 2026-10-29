"""Vision extraction for statements that have no text layer.

pdf.js can only read a PDF's text layer. A photographed passbook page, a scanned
statement or a handwritten ledger has none, so the text parser sees nothing.

Gemini 2.5 Flash is multimodal: it can read the page image directly. This module
sends the file, gets back structured transactions, and validates every row
before it reaches the engine. The model never decides anything: it only reads.

Honest limits, which the caller surfaces to the user:
  - handwriting is genuinely hard, and no model is 100 percent on it
  - a blurred or skewed photo will lose rows, which is why every row carries its
    own confidence and the whole parse carries a validated count
"""

from __future__ import annotations

import asyncio
import base64
import json
import os
import re
from dataclasses import dataclass, field
from typing import Any, Optional

import httpx

from .schemas import Txn

DEFAULT_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

PROMPT = """You are reading a bank statement page. It may be a clean digital PDF, a scan,
a photograph of a printed statement, or a handwritten ledger or passbook page.

Extract EVERY transaction row you can see, in the order they appear.

Rules:
1. Never invent a transaction. If a row is illegible, skip it and mention it in `notes`.
2. Amounts are positive numbers. Use `type` to say whether money came in (credit) or went out (debit).
3. Decide credit versus debit from, in order of preference: an explicit Cr/Dr or Credit/Debit marker,
   the column the amount sits in (withdrawal or deposit), or a minus sign. If none is present,
   use the running balance: if the balance went up it is a credit, if it went down it is a debit.
4. Dates must be ISO YYYY-MM-DD. Indian statements are usually DD/MM/YYYY. If the year is missing,
   infer it from the statement period.
5. `balance` is the running balance after the transaction, if the statement shows one. Omit it if not.
6. Handwriting: transcribe carefully. Digits 0/6/8, 1/7 and 5/6 are the usual confusions. Give each
   row a `confidence` between 0 and 1 that reflects how sure you are of that row's numbers.
7. If the page contains no transactions at all, return an empty array and say why in `notes`.
"""

RESPONSE_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "bank": {"type": "string"},
        "period": {"type": "string"},
        "handwritten": {"type": "boolean"},
        "notes": {"type": "string"},
        "transactions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "date": {"type": "string"},
                    "description": {"type": "string"},
                    "amount": {"type": "number"},
                    "type": {"type": "string", "enum": ["credit", "debit"]},
                    "balance": {"type": "number"},
                    "confidence": {"type": "number"},
                },
                "required": ["date", "description", "amount", "type"],
            },
        },
    },
    "required": ["transactions"],
}


@dataclass
class VisionResult:
    transactions: list[Txn]
    bank: Optional[str] = None
    period: Optional[str] = None
    handwritten: bool = False
    notes: str = ""
    confidence: float = 0.0
    method: str = ""
    rejected_rows: list[str] = field(default_factory=list)


def api_key() -> Optional[str]:
    return os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")


def available() -> bool:
    return bool(api_key())


def _iso_date(raw: str) -> Optional[str]:
    raw = (raw or "").strip()
    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})$", raw)
    if m:
        return raw
    m = re.match(r"^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$", raw)
    if m:
        d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if y < 100:
            y += 2000 if y < 70 else 1900
        if mo > 12 and d <= 12:
            d, mo = mo, d
        if 1 <= mo <= 12 and 1 <= d <= 31:
            return f"{y:04d}-{mo:02d}-{d:02d}"
    return None


def normalise(payload: dict[str, Any], model: str) -> VisionResult:
    """Validate the model's rows. Anything malformed is dropped and reported."""
    txns: list[Txn] = []
    confidences: list[float] = []
    rejected: list[str] = []

    for row in payload.get("transactions") or []:
        date = _iso_date(str(row.get("date", "")))
        try:
            amount = abs(float(row.get("amount", 0)))
        except (TypeError, ValueError):
            amount = 0.0
        kind = str(row.get("type", "")).lower()

        if not date or amount <= 0 or kind not in {"credit", "debit"}:
            rejected.append(json.dumps(row)[:120])
            continue

        balance = row.get("balance")
        txns.append(
            Txn(
                date=date,
                description=str(row.get("description", "Transaction"))[:80] or "Transaction",
                amount=round(amount, 2),
                type=kind,  # type: ignore[arg-type]
                balance=float(balance) if isinstance(balance, (int, float)) else None,
            )
        )
        try:
            confidences.append(max(0.0, min(1.0, float(row.get("confidence", 0.8)))))
        except (TypeError, ValueError):
            confidences.append(0.8)

    txns.sort(key=lambda t: t.date)

    seen: set[tuple] = set()
    unique: list[Txn] = []
    for t in txns:
        key = (t.date, t.amount, t.type, t.description)
        if key in seen:
            continue
        seen.add(key)
        unique.append(t)

    total_rows = len(unique) + len(rejected)
    row_quality = (sum(confidences) / len(confidences)) if confidences else 0.0
    completeness = (len(unique) / total_rows) if total_rows else 0.0
    confidence = round(min(0.99, row_quality * (0.6 + 0.4 * completeness)), 4) if unique else 0.0

    return VisionResult(
        transactions=unique,
        bank=payload.get("bank") or None,
        period=payload.get("period") or None,
        handwritten=bool(payload.get("handwritten")),
        notes=str(payload.get("notes") or ""),
        confidence=confidence,
        method=f"{model}-vision",
        rejected_rows=rejected,
    )


async def extract_transactions(
    file_bytes: bytes,
    mime_type: str,
    model: str = DEFAULT_MODEL,
    timeout: float = 90.0,
) -> VisionResult:
    key = api_key()
    if not key:
        raise RuntimeError("GEMINI_API_KEY is not set")

    body = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": PROMPT},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": base64.b64encode(file_bytes).decode("ascii"),
                        }
                    },
                ],
            }
        ],
        "generationConfig": {
            "temperature": 0,
            "topP": 0.1,
            "responseMimeType": "application/json",
            "responseSchema": RESPONSE_SCHEMA,
        },
    }

    # Gemini returns 429/500/503 under load. A statement upload is a user waiting
    # in front of a screen, so retry a few times with backoff before failing.
    RETRYABLE = {429, 500, 502, 503, 504}
    last_error = ""
    response = None

    async with httpx.AsyncClient(timeout=timeout) as client:
        for attempt in range(1, 4):
            response = await client.post(
                ENDPOINT.format(model=model),
                params={"key": key},
                json=body,
                headers={"Content-Type": "application/json"},
            )
            if response.status_code == 200:
                break
            last_error = f"Gemini returned {response.status_code}: {response.text[:200]}"
            if response.status_code not in RETRYABLE or attempt == 3:
                raise RuntimeError(last_error)
            await asyncio.sleep(1.5 * attempt)

    if response is None or response.status_code != 200:
        raise RuntimeError(last_error or "Gemini call failed")

    data = response.json()
    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as exc:
        raise RuntimeError("Gemini returned no content") from exc

    try:
        payload = json.loads(text)
    except json.JSONDecodeError as exc:
        raise RuntimeError("Gemini did not return valid JSON") from exc

    return normalise(payload, model)
