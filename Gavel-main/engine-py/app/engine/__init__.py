"""Deterministic underwriting engine: Python port.

This mirrors `src/lib/engine/` (TypeScript) and
`backend/src/services/underwriting-engine.ts` (Node) exactly. A parity test
(`tests/test_parity.py`) asserts all three agree on the same fixtures, so the
same file always produces the same decision regardless of which service
answered.
"""

from __future__ import annotations

from..schemas import PolicyConfig, PolicyRule
from.policy import DEFAULT_POLICY, load_policy
from.signals import derive_signals
from.evaluate import analyze, compute_credit_limit
from.parser import parse_statement_text

__all__ = [
    "DEFAULT_POLICY",
    "PolicyConfig",
    "PolicyRule",
    "derive_signals",
    "analyze",
    "compute_credit_limit",
    "parse_statement_text",
]
