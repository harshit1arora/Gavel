/**
 * Shared types for the open-source underwriting engine.
 *
 * These mirror the backend contract (`backend/src/types/underwriting.ts`) so a
 * decision computed in the browser and a decision computed by the API are the
 * same shape, and can be compared field by field.
 */

export interface Txn {
  /** ISO date, YYYY-MM-DD. */
  date: string;
  description: string;
  /** Always positive; `type` carries the direction. */
  amount: number;
  type: "credit" | "debit";
  balance?: number;
}

export interface Signals {
  monthly_income: number;
  emi_ratio: number;
  emi_count: number;
  emi_total: number;
  avg_residual: number;
  min_balance: number;
  salary_count: number;
  income_volatility: number;
  income_type: "salary" | "variable";
  months_of_data: number;
  months_active: number;
  transaction_count: number;
  credit_count: number;
  debit_count: number;
  total_credits: number;
  total_debits: number;
  savings_ratio: number;
}

export type Op = "gte" | "lte" | "gt" | "lt" | "eq" | "neq";
export type RuleAction = "hard_reject" | "score" | "review_flag";

export interface PolicyRule {
  id: string;
  name: string;
  field: keyof Signals | string;
  op: Op;
  value: number | string;
  action: RuleAction;
  weight: number;
  explanation?: string;
}

export interface PolicyConfig {
  policy_id: string;
  pilot?: string;
  version: string;
  min_data_months: number;
  bands: { approve_min: number; review_min: number };
  limit_formula: {
    method: string;
    income_multiple: number;
    score_weighting?: boolean;
    round_to_nearest?: number;
    max_limit?: number;
    min_limit?: number;
  };
  rules: PolicyRule[];
}

export interface RuleFired {
  id: string;
  name: string;
  condition: string;
  result: boolean;
  skipped: boolean;
  explanation?: string;
}

export interface Reason {
  code: string;
  label: string;
  weight: number;
  sentiment: "positive" | "negative" | "neutral";
  detail: string;
}

export type DecisionType = "APPROVE" | "REVIEW" | "REJECT";

export interface EngineError {
  code: string;
  message: string;
  detail: string;
}

export interface DecisionResult {
  decision: DecisionType;
  credit_limit: number;
  risk_score: number;
  confidence: number;
  processing_time_ms: number;
  engine_version: string;
  policy_id: string;
  audit_id: string;
  reasons: Reason[];
  rules_fired: RuleFired[];
  flags: string[];
  signals: Signals;
  error?: EngineError;
}

export interface AnalyzeInput {
  transactions: Txn[];
  /** e.g. "6 months", used to compute months of data when present. */
  period?: string;
  declaredIncome?: number;
}
