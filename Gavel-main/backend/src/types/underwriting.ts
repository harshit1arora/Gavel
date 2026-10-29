/**
 * Canonical contract types for the Gavel underwriting engine.
 *
 * These mirror the frontend `AnalysisResult` shape in
 * `src/lib/underwriting-types.ts` exactly: the two files are the single
 * source of truth for the `/v1/underwriting/analyze` contract and MUST be
 * kept in sync. (The repo is split into two TS packages with separate
 * tsconfigs, so the shape is declared on each side rather than imported
 * across the package boundary.)
 */

export type DecisionType = 'APPROVE' | 'REJECT' | 'REVIEW';

export interface Reason {
  code: string;
  label: string;
  weight: number;
  detail: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface Rule {
  id: string;
  name: string;
  condition: string;
  result: boolean;
  skipped: boolean;
}

export interface ErrorResult {
  code: string;
  message: string;
  detail: string;
}

export interface AnalysisResult {
  decision: DecisionType;
  credit_limit: number;
  risk_score: number;
  confidence: number;
  processing_time_ms: number;
  engine_version: string;
  audit_id: string;
  reasons: Reason[];
  rules_fired: Rule[];
  flags: string[];
  error?: ErrorResult;
}

// ── Policy config schema (data, not code) ───────────────────────────────

export type RuleAction = 'hard_reject' | 'score' | 'review_flag';
export type RuleOp = 'gte' | 'lte' | 'gt' | 'lt' | 'eq' | 'neq';

export interface PolicyRule {
  id: string;
  name: string;
  field: string;
  op: RuleOp;
  /** A rule's condition is phrased as the "good" / passing case. */
  value: number | string;
  action: RuleAction;
  /** Score contribution (0..1) added when a `score` rule passes. */
  weight: number;
  explanation: string;
}

export interface PolicyBands {
  /** risk_score (0-100) at or above which the decision is APPROVE. */
  approve_min: number;
  /** risk_score at or above which the decision is REVIEW (else REJECT). */
  review_min: number;
}

export interface LimitFormula {
  method: 'income_multiple';
  income_multiple: number;
  /** When true, the limit is scaled by risk_score/100. */
  score_weighting: boolean;
  round_to_nearest: number;
  max_limit: number;
  min_limit: number;
}

export interface PolicyConfig {
  policy_id: string;
  pilot: string;
  version: string;
  min_data_months: number;
  bands: PolicyBands;
  limit_formula: LimitFormula;
  rules: PolicyRule[];
}

// ── Engine input contract ───────────────────────────────────────────────

export interface InputTransaction {
  date: string;
  description: string;
  amount: number;
  type?: 'credit' | 'debit';
  balance?: number | null;
  category?: string;
}

export interface AnalyzeInput {
  applicant: {
    name: string;
    pan: string;
    monthly_income_declared?: number;
  };
  bank_statement: {
    account_number?: string;
    bank?: string;
    period?: string;
    transactions: InputTransaction[];
  };
  loan_request?: {
    amount?: number;
    tenure_months?: number;
    purpose?: string;
  };
}

/** Derived, auditable signals the rules are evaluated against. */
export interface DerivedSignals {
  monthly_income: number;
  emi_ratio: number;
  emi_count: number;
  emi_total: number;
  avg_residual: number;
  min_balance: number;
  salary_count: number;
  income_volatility: number;
  income_type: 'salary' | 'variable';
  months_of_data: number;
  months_active: number;
  transaction_count: number;
  credit_count: number;
  debit_count: number;
  total_credits: number;
  total_debits: number;
  savings_ratio: number;
}
