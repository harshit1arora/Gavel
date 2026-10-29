"""AI layer, explanation only, never decisioning.

The credit decision is produced by the deterministic rules engine. This module
turns that decision into a human-readable credit note. If no LLM key is
configured (or the call fails), it falls back to a deterministic template built
from the same rule trace, so the endpoint always returns something truthful.
"""

from __future__ import annotations

import os
from typing import Optional

from.schemas import DecisionResult

SYSTEM_PROMPT = (
    "You are a credit analyst assistant. You are given a deterministic underwriting "
    "decision with its rule trace. Write a concise credit note (max 140 words) for a "
    "credit officer. Use ONLY the facts provided. Never invent numbers, never change "
    "the decision, and state the decision explicitly in the first sentence."
)


def _template_note(result: DecisionResult, applicant: Optional[str]) -> str:
    who = applicant or "The applicant"
    positives = [r for r in result.reasons if r.sentiment == "positive"]
    negatives = [r for r in result.reasons if r.sentiment != "positive"]
    parts = [
        f"{who} is {result.decision.lower()}d with a risk score of {result.risk_score}/100 "
        f"(policy {result.policy_id} v{result.engine_version})."
    ]
    if result.decision != "REJECT":
        parts.append(
            f"Sanction limit ₹{result.credit_limit:,} based on a monthly income of "
            f"₹{result.signals.monthly_income:,} and an EMI ratio of "
            f"{result.signals.emi_ratio * 100:.1f}%."
        )
    if negatives:
        parts.append(
            "Points against: " + "; ".join(r.label for r in negatives[:3]) + "."
        )
    if positives:
        parts.append(
            "Points in favour: " + "; ".join(r.label for r in positives[:3]) + "."
        )
    parts.append(f"Audit id {result.audit_id}.")
    return " ".join(parts)


async def explain(result: DecisionResult, applicant: Optional[str] = None) -> dict:
    """Return a credit note plus the source that produced it."""
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        return {"note": _template_note(result, applicant), "source": "deterministic-template"}

    try:
        from google import genai # type: ignore

        client = genai.Client(api_key=key)
        facts = {
            "applicant": applicant,
            "decision": result.decision,
            "risk_score": result.risk_score,
            "credit_limit": result.credit_limit,
            "signals": result.signals.model_dump(),
            "reasons": [r.model_dump() for r in result.reasons],
        }
        prompt = f"{SYSTEM_PROMPT}\n\nDecision record:\n{facts}"
        response = client.models.generate_content(
            model=os.environ.get("GEMINI_MODEL", "gemini-1.5-flash"),
            contents=prompt,
        )
        text = (getattr(response, "text", "") or "").strip()
        if text:
            return {"note": text, "source": "gemini"}
    except Exception:
        pass

    return {"note": _template_note(result, applicant), "source": "deterministic-template"}
