"""Signal derivation: a line-for-line port of src/lib/engine/signals.ts."""

from __future__ import annotations

import re
from statistics import mean, pstdev
from typing import Iterable

from..schemas import Signals, Txn

SALARY_RE = re.compile(r"salary|payroll|stipend|wages|sal cr|sal credit", re.I)
EMI_RE = re.compile(
    r"emi|\bloan\b|finance|repayment|installment|instalment|equated", re.I
)


def month_key(date_str: str) -> str:
    m = re.match(r"^(\d{4})-(\d{2})", date_str)
    if m:
        return f"{m.group(1)}-{m.group(2)}"
    return date_str[:7]


def _coefficient_of_variation(values: Iterable[float]) -> float:
    non_zero = [v for v in values if v > 0]
    if len(non_zero) < 2:
        return 0.0
    mu = mean(non_zero)
    if mu <= 0:
        return 0.0
    return pstdev(non_zero) / mu


def _parse_period_months(period: str | None) -> int | None:
    if not period:
        return None
    m = re.search(r"(\d+)\s*month", period, re.I)
    return int(m.group(1)) if m else None


def derive_signals(transactions: list[Txn], period: str | None = None) -> Signals:
    txns = [t for t in transactions if t.amount is not None and t.amount != 0]
    credits = [t for t in txns if t.type == "credit"]
    debits = [t for t in txns if t.type == "debit"]

    salary_credits = [t for t in credits if SALARY_RE.search(t.description or "")]
    emi_debits = [t for t in debits if EMI_RE.search(t.description or "")]

    distinct_txn_months = len({month_key(t.date) for t in txns})
    distinct_credit_months = len({month_key(t.date) for t in credits}) or 1
    months_of_data = _parse_period_months(period) or distinct_txn_months
    months_active = max(distinct_txn_months, 1)

    total_credits = sum(t.amount for t in credits)
    total_debits = sum(t.amount for t in debits)

    salary_count = len(salary_credits)
    income_type = "salary" if salary_count > 0 else "variable"
    if salary_count > 0:
        monthly_income = sum(t.amount for t in salary_credits) / salary_count
    else:
        monthly_income = total_credits / distinct_credit_months

    emi_total = sum(t.amount for t in emi_debits)
    emi_monthly = emi_total / months_active
    emi_ratio = (emi_monthly / monthly_income) if monthly_income > 0 else 0.0
    emi_count = len({(t.description or "").strip() for t in emi_debits})

    balances = [t.balance for t in txns if t.balance is not None]
    avg_residual = mean(balances) if balances else 0.0
    min_balance = min(balances) if balances else 0.0

    by_month: dict[str, float] = {}
    for t in credits:
        k = month_key(t.date)
        by_month[k] = by_month.get(k, 0.0) + t.amount
    income_volatility = _coefficient_of_variation(by_month.values())

    savings_ratio = (
        (total_credits - total_debits) / total_credits if total_credits > 0 else 0.0
    )

    return Signals(
        monthly_income=round(monthly_income),
        emi_ratio=round(emi_ratio, 4),
        emi_count=emi_count,
        emi_total=round(emi_total),
        avg_residual=round(avg_residual),
        min_balance=round(min_balance),
        salary_count=salary_count,
        income_volatility=round(income_volatility, 4),
        income_type=income_type, # type: ignore[arg-type]
        months_of_data=months_of_data,
        months_active=months_active,
        transaction_count=len(txns),
        credit_count=len(credits),
        debit_count=len(debits),
        total_credits=round(total_credits),
        total_debits=round(total_debits),
        savings_ratio=round(savings_ratio, 4),
    )
