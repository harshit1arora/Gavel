"""Engine unit tests: determinism, fail-closed behaviour, parser, credit limit."""

from __future__ import annotations

from app.engine import DEFAULT_POLICY, analyze, derive_signals, parse_statement_text
from app.engine.evaluate import compare, compute_credit_limit
from app.schemas import PolicyConfig, Txn

STATEMENT_TEXT = """HDFC BANK - STATEMENT OF ACCOUNT
Account: XXXX4471    Period: 6 months
Date        Particulars                    Amount        Balance
03/05/2026  SALARY CREDIT - INFOSYS LTD   44,762.00     86,762.00 Cr
07/05/2026  EMI BAJAJ FINANCE              8,500.00     78,262.00 Dr
12/05/2026  UPI-SWIGGY                       640.00     77,622.00 Dr
03/06/2026  SALARY CREDIT - INFOSYS LTD   44,800.00    122,422.00 Cr
07/06/2026  EMI BAJAJ FINANCE              8,500.00    113,922.00 Dr
"""


def test_parser_extracts_transactions_and_bank() -> None:
    parsed = parse_statement_text(STATEMENT_TEXT)
    assert parsed.bank == "HDFC"
    assert len(parsed.transactions) == 5
    assert parsed.transactions[0].type == "credit"
    assert parsed.transactions[1].type == "debit"
    assert parsed.transactions[0].amount == 44762.0
    assert parsed.confidence > 0.9


def test_parser_handles_dates_and_garbage() -> None:
    assert parse_statement_text("nothing here").transactions == []
    assert parse_statement_text("nothing here").warnings


def test_signals_from_transactions() -> None:
    parsed = parse_statement_text(STATEMENT_TEXT)
    signals = derive_signals(parsed.transactions, parsed.period)
    assert signals.income_type == "salary"
    assert signals.salary_count == 2
    assert 44_000 < signals.monthly_income < 45_000
    assert signals.emi_count == 1  # same description counted once


def test_deterministic() -> None:
    parsed = parse_statement_text(STATEMENT_TEXT)
    a = analyze(parsed.transactions, parsed.period)
    b = analyze(parsed.transactions, parsed.period)
    assert a.decision == b.decision
    assert a.risk_score == b.risk_score
    assert [(r.id, r.result) for r in a.rules_fired] == [
        (r.id, r.result) for r in b.rules_fired
    ]
    assert a.audit_id != b.audit_id  # unique per evaluation
    assert len(a.audit_id.split("_")[-1]) == 16


def test_insufficient_history_rejects_with_e001() -> None:
    txns = [Txn(date="2026-06-03", description="SALARY", amount=45000, type="credit", balance=45000)]
    result = analyze(txns, None)
    assert result.decision == "REJECT"
    assert result.error is not None and result.error.code == "E001"


def test_hard_reject_missing_signal_fails_closed() -> None:
    broken = PolicyConfig(
        **{
            **DEFAULT_POLICY.model_dump(),
            "rules": [
                {**DEFAULT_POLICY.rules[0].model_dump(), "field": "no_such_signal", "action": "hard_reject"},
                *[r.model_dump() for r in DEFAULT_POLICY.rules[1:]],
            ],
        }
    )
    parsed = parse_statement_text(STATEMENT_TEXT)
    result = analyze(parsed.transactions, "6 months", broken)
    assert result.decision != "APPROVE"
    assert any(f.startswith("missing_signal:") for f in result.flags)


def test_credit_limit_respects_cap_and_floor() -> None:
    policy = DEFAULT_POLICY.model_copy(deep=True)
    policy.limit_formula.max_limit = 300_000
    assert compute_credit_limit(policy, 100_000, 100) == 300_000
    policy.limit_formula.min_limit = 25_000
    assert compute_credit_limit(policy, 100, 10) == 25_000


def test_compare_operators() -> None:
    assert compare(5, "gte", 5) is True
    assert compare(5, "gt", 5) is False
    assert compare("salary", "eq", "salary") is True
    assert compare("salary", "neq", "salary") is False
    assert compare(5, "gte", "salary") is False
