"""Shared contract types. Mirrors src/lib/engine/types.ts."""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

TxnType = Literal["credit", "debit"]
DecisionType = Literal["APPROVE", "REVIEW", "REJECT"]
Op = Literal["gte", "lte", "gt", "lt", "eq", "neq"]
RuleAction = Literal["hard_reject", "score", "review_flag"]


class Txn(BaseModel):
    date: str = Field(description="ISO date, YYYY-MM-DD")
    description: str
    amount: float = Field(ge=0, description="Always positive; `type` carries direction")
    type: TxnType
    balance: Optional[float] = None


class Signals(BaseModel):
    monthly_income: int
    emi_ratio: float
    emi_count: int
    emi_total: int
    avg_residual: int
    min_balance: int
    salary_count: int
    income_volatility: float
    income_type: Literal["salary", "variable"]
    months_of_data: int
    months_active: int
    transaction_count: int
    credit_count: int
    debit_count: int
    total_credits: int
    total_debits: int
    savings_ratio: float


class PolicyRule(BaseModel):
    id: str
    name: str
    field: str
    op: Op
    value: float | str
    action: RuleAction
    weight: float = 0
    explanation: Optional[str] = None


class LimitFormula(BaseModel):
    method: str = "income_multiple"
    income_multiple: float = 7
    score_weighting: bool = True
    round_to_nearest: int = 10_000
    max_limit: float | None = 1_000_000
    min_limit: float | None = 0


class Bands(BaseModel):
    approve_min: int
    review_min: int


class PolicyConfig(BaseModel):
    policy_id: str
    pilot: Optional[str] = None
    version: str
    min_data_months: int = 3
    bands: Bands
    limit_formula: LimitFormula
    rules: list[PolicyRule]


class RuleFired(BaseModel):
    id: str
    name: str
    condition: str
    result: bool
    skipped: bool
    explanation: Optional[str] = None


class Reason(BaseModel):
    code: str
    label: str
    weight: float
    sentiment: Literal["positive", "negative", "neutral"]
    detail: str


class EngineError(BaseModel):
    code: str
    message: str
    detail: str


class DecisionResult(BaseModel):
    decision: DecisionType
    credit_limit: int
    risk_score: int
    confidence: float
    processing_time_ms: int
    engine_version: str
    policy_id: str
    audit_id: str
    reasons: list[Reason]
    rules_fired: list[RuleFired]
    flags: list[str]
    signals: Signals
    error: Optional[EngineError] = None


class EvaluateRequest(BaseModel):
    transactions: list[Txn]
    period: Optional[str] = Field(default=None, description='e.g. "6 months"')
    applicant_id: Optional[str] = None
    policy_id: Optional[str] = None


class ParseRequest(BaseModel):
    text: str = Field(description="Raw statement text (already extracted from the PDF)")


class ParsedStatement(BaseModel):
    transactions: list[Txn]
    bank: Optional[str] = None
    period: Optional[str] = None
    confidence: float
    lines_scanned: int
    warnings: list[str]
