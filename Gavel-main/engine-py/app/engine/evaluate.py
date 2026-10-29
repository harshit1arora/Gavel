"""Deterministic evaluation, port of src/lib/engine/evaluate.ts.

Same inputs and same policy always produce the same decision, the same rule
trace and the same shape of audit record as the TypeScript engine.
"""

from __future__ import annotations

import secrets
import time

from..schemas import (
    DecisionResult,
    EngineError,
    PolicyConfig,
    PolicyRule,
    Reason,
    RuleFired,
    Signals,
)
from.policy import DEFAULT_POLICY
from.signals import derive_signals

OP_SYMBOL = {
    "gte": ">=",
    "lte": "<=",
    "gt": ">",
    "lt": "<",
    "eq": "==",
    "neq": "!=",
}


def new_audit_id() -> str:
    return f"gavel_{int(time.time() * 1000)}_{secrets.token_hex(8)}"


def compare(signal: float | str, op: str, value: float | str) -> bool:
    if isinstance(value, str) or isinstance(signal, str):
        a, b = str(signal), str(value)
        if op == "eq":
            return a == b
        if op == "neq":
            return a != b
        return False
    if op == "gte":
        return signal >= value # type: ignore[operator]
    if op == "lte":
        return signal <= value # type: ignore[operator]
    if op == "gt":
        return signal > value # type: ignore[operator]
    if op == "lt":
        return signal < value # type: ignore[operator]
    if op == "eq":
        return signal == value
    if op == "neq":
        return signal != value
    return False


def compute_credit_limit(policy: PolicyConfig, income: float, score: int) -> int:
    f = policy.limit_formula
    base = income * f.income_multiple
    weighted = base * (score / 100) if f.score_weighting else base
    step = f.round_to_nearest or 10_000
    rounded = round(weighted / step) * step
    low = f.min_limit if f.min_limit is not None else 0
    high = f.max_limit if f.max_limit is not None else float("inf")
    return int(max(low, min(high, rounded)))


def _reason(rule: PolicyRule, sentiment: str) -> Reason:
    return Reason(
        code=rule.id,
        label=rule.name,
        weight=rule.weight,
        sentiment=sentiment, # type: ignore[arg-type]
        detail=rule.explanation
        or f"{rule.field} {OP_SYMBOL.get(rule.op, rule.op)} {rule.value}",
    )


def analyze(
    transactions,
    period: str | None = None,
    policy: PolicyConfig | None = None,
) -> DecisionResult:
    policy = policy or DEFAULT_POLICY
    started = time.perf_counter()
    signals: Signals = derive_signals(transactions, period)

    def elapsed_ms() -> int:
        return max(0, int((time.perf_counter() - started) * 1000))

    base = dict(
        engine_version=policy.version,
        policy_id=policy.policy_id,
        audit_id=new_audit_id(),
        signals=signals,
    )

    if signals.months_of_data < policy.min_data_months:
        return DecisionResult(
            **base,
            decision="REJECT",
            credit_limit=0,
            risk_score=0,
            confidence=1.0,
            processing_time_ms=elapsed_ms(),
            reasons=[],
            rules_fired=[],
            flags=[],
            error=EngineError(
                code="E001",
                message="Insufficient transaction history",
                detail=(
                    f"Policy requires at least {policy.min_data_months} months of "
                    f"statement data; {signals.months_of_data} month(s) detected."
                ),
            ),
        )

    signal_map = signals.model_dump()
    rules_fired: list[RuleFired] = []
    positive: list[PolicyRule] = []
    hard_failures: list[PolicyRule] = []
    review_failures: list[PolicyRule] = []
    flags: list[str] = []
    score = 0.0

    for rule in policy.rules:
        signal = signal_map.get(rule.field)
        skipped = signal is None
        passed = False if skipped else compare(signal, rule.op, rule.value)

        rules_fired.append(
            RuleFired(
                id=rule.id,
                name=rule.name,
                condition=f"{rule.field} {OP_SYMBOL.get(rule.op, rule.op)} {rule.value}",
                result=passed,
                skipped=skipped,
                explanation=rule.explanation,
            )
        )

        if skipped:
            # Never fail open on a hard reject.
            if rule.action == "hard_reject":
                review_failures.append(rule)
                flags.append(f"missing_signal:{rule.field}")
            continue

        if rule.action == "hard_reject" and not passed:
            hard_failures.append(rule)
        elif rule.action == "score" and passed:
            score += rule.weight
            positive.append(rule)
        elif rule.action == "review_flag" and not passed:
            review_failures.append(rule)
            flags.append(rule.id)

    risk_score = max(0, min(100, round(score * 100)))

    if hard_failures:
        decision = "REJECT"
    elif risk_score < policy.bands.review_min:
        decision = "REJECT"
    elif review_failures or risk_score < policy.bands.approve_min:
        decision = "REVIEW"
    else:
        decision = "APPROVE"

    reasons: list[Reason] = (
        [_reason(r, "negative") for r in hard_failures]
        + [_reason(r, "negative") for r in review_failures]
        + [
            _reason(r, "positive")
            for r in sorted(positive, key=lambda r: r.weight, reverse=True)[:4]
        ]
    )

    credit_limit = (
        0
        if decision == "REJECT"
        else compute_credit_limit(policy, signals.monthly_income, risk_score)
    )
    confidence = round(
        max(0.5, min(0.99, 0.55 + signals.months_of_data * 0.06)), 2
    )

    return DecisionResult(
        **base,
        decision=decision, # type: ignore[arg-type]
        credit_limit=credit_limit,
        risk_score=risk_score,
        confidence=confidence,
        processing_time_ms=elapsed_ms(),
        reasons=reasons,
        rules_fired=rules_fired,
        flags=flags,
    )
