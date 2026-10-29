/**
 * Gavel deterministic underwriting engine.
 *
 * Pure & synchronous: given normalized bank-statement transactions and a
 * hand-tuned policy config, it derives auditable signals, runs the policy's
 * hard-reject gates, accumulates a weighted risk score, maps the score to a
 * decision band, applies review flags, and computes a credit limit from the
 * policy's `limit_formula`.
 *
 * The same (input, policy) pair always yields the same `AnalysisResult`, so any
 * past decision can be recomputed identically for an RBI audit. The rules are
 * data (see `config/policies/*.json`), never hardcoded; that is the whole
 * point of the pilot build.
 */

import crypto from 'crypto';
import {
  AnalysisResult,
  AnalyzeInput,
  DerivedSignals,
  InputTransaction,
  PolicyConfig,
  PolicyRule,
  Reason,
  Rule,
} from '../types/underwriting';

const SALARY_RE = /salary|payroll|stipend|wages|sal cr/i;
const EMI_RE = /emi|\bloan\b|finance|repayment|installment|instalment|fullerton|bajaj|hdfc bank|equated/i;

const OP_SYMBOL: Record<PolicyRule['op'], string> = {
  gte: '>=',
  lte: '<=',
  gt: '>',
  lt: '<',
  eq: '==',
  neq: '!=',
};

/** Normalize a transaction's signed amount + type into (sign, magnitude). */
function normalizeTxn(t: InputTransaction): { amount: number; type: 'credit' | 'debit' } {
  const raw = Number(t.amount) || 0;
  const type: 'credit' | 'debit' = t.type
    ? t.type
: raw >= 0
      ? 'credit'
: 'debit';
  return { amount: Math.abs(raw), type };
}

function monthKey(dateStr: string): string {
  // Expecting YYYY-MM-DD; fall back to a best-effort parse.
  const m = /^(\d{4})-(\d{2})/.exec(dateStr);
  if (m) return `${m[1]}-${m[2]}`;
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  return dateStr;
}

function coefficientOfVariation(values: number[]): number {
  const nonZero = values.filter(v => v > 0);
  if (nonZero.length < 2) return 0;
  const mean = nonZero.reduce((a, b) => a + b, 0) / nonZero.length;
  if (mean <= 0) return 0;
  const variance =
    nonZero.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / nonZero.length;
  return Math.sqrt(variance) / mean;
}

function parsePeriodMonths(period?: string): number | null {
  if (!period) return null;
  const m = /(\d+)\s*month/i.exec(period);
  if (m) return parseInt(m[1], 10);
  return null;
}

/**
 * Derive the auditable signals the policy rules are evaluated against.
 * Exported for testing; these are the exact numbers stamped into the audit row.
 */
export function deriveSignals(input: AnalyzeInput): DerivedSignals {
  const txns = (input.bank_statement?.transactions || []).map(t => ({
...t,
...normalizeTxn(t),
  }));

  const credits = txns.filter(t => t.type === 'credit');
  const debits = txns.filter(t => t.type === 'debit');

  const salaryCredits = credits.filter(t => SALARY_RE.test(t.description || ''));
  const emiDebits = debits.filter(t => EMI_RE.test(t.description || ''));

  // Months covered: prefer the declared statement period, fall back to the
  // distinct calendar months actually present in the transaction data.
  const distinctTxnMonths = new Set(txns.map(t => monthKey(t.date))).size;
  const distinctCreditMonths =
    new Set(credits.map(t => monthKey(t.date))).size || 1;
  const periodMonths = parsePeriodMonths(input.bank_statement?.period);
  const months_of_data = periodMonths ?? distinctTxnMonths;
  const months_active = Math.max(distinctTxnMonths, 1);

  const total_credits = credits.reduce((s, t) => s + t.amount, 0);
  const total_debits = debits.reduce((s, t) => s + t.amount, 0);

  // Monthly income: average salary credit when salaried; otherwise average
  // monthly inflow across the months that actually had credits (self-employed).
  const salary_count = salaryCredits.length;
  const income_type: 'salary' | 'variable' = salary_count > 0 ? 'salary': 'variable';
  const monthly_income =
    salary_count > 0
      ? salaryCredits.reduce((s, t) => s + t.amount, 0) / salary_count
: total_credits / distinctCreditMonths;

  const emi_total = emiDebits.reduce((s, t) => s + t.amount, 0);
  const emi_monthly = emi_total / months_active;
  const emi_ratio = monthly_income > 0 ? emi_monthly / monthly_income: 0;
  const emi_count = new Set(emiDebits.map(t => (t.description || '').trim())).size;

  const balances = txns
.map(t => t.balance)
.filter((b): b is number => typeof b === 'number');
  const avg_residual =
    balances.length > 0 ? balances.reduce((s, b) => s + b, 0) / balances.length: 0;
  const min_balance = balances.length > 0 ? Math.min(...balances): 0;

  // Income volatility: coefficient of variation of monthly credit totals.
  const byMonth = new Map<string, number>();
  for (const t of credits) {
    byMonth.set(monthKey(t.date), (byMonth.get(monthKey(t.date)) || 0) + t.amount);
  }
  const income_volatility = coefficientOfVariation(Array.from(byMonth.values()));

  const savings_ratio =
    total_credits > 0 ? (total_credits - total_debits) / total_credits: 0;

  return {
    monthly_income: Math.round(monthly_income),
    emi_ratio: Number(emi_ratio.toFixed(4)),
    emi_count,
    emi_total: Math.round(emi_total),
    avg_residual: Math.round(avg_residual),
    min_balance: Math.round(min_balance),
    salary_count,
    income_volatility: Number(income_volatility.toFixed(4)),
    income_type,
    months_of_data,
    months_active,
    transaction_count: txns.length,
    credit_count: credits.length,
    debit_count: debits.length,
    total_credits: Math.round(total_credits),
    total_debits: Math.round(total_debits),
    savings_ratio: Number(savings_ratio.toFixed(4)),
  };
}

function compare(signal: number | string, op: PolicyRule['op'], value: number | string): boolean {
  if (typeof value === 'string' || typeof signal === 'string') {
    const a = String(signal);
    const b = String(value);
    switch (op) {
      case 'eq':
        return a === b;
      case 'neq':
        return a !== b;
      default:
        return false;
    }
  }
  switch (op) {
    case 'gte':
      return signal >= value;
    case 'lte':
      return signal <= value;
    case 'gt':
      return signal > value;
    case 'lt':
      return signal < value;
    case 'eq':
      return signal === value;
    case 'neq':
      return signal !== value;
    default:
      return false;
  }
}

/** Compute the sanctioned credit limit from the policy's limit_formula. */
export function computeCreditLimit(
  policy: PolicyConfig,
  monthlyIncome: number,
  riskScore: number,
): number {
  const f = policy.limit_formula;
  const scale = f.score_weighting ? riskScore / 100: 1;
  let limit = monthlyIncome * f.income_multiple * scale;
  if (f.round_to_nearest > 0) {
    limit = Math.round(limit / f.round_to_nearest) * f.round_to_nearest;
  }
  return Math.max(f.min_limit, Math.min(f.max_limit, limit));
}

/** A stable SHA-256 content hash of a policy config (for audit replay). */
export function hashPolicy(policy: PolicyConfig): string {
  return crypto
.createHash('sha256')
.update(JSON.stringify(policy))
.digest('hex')
.slice(0, 16);
}

function newAuditId(now: number): string {
  // 8 random bytes (64 bits), the previous 3 bytes gave a 1-in-16M collision
  // chance per same-millisecond burst, and the audit row is written with.set().
  return `gavel_${now}_${crypto.randomBytes(8).toString('hex')}`;
}

export interface EngineOptions {
  /** Injected for deterministic tests; defaults to Date.now(). */
  now?: number;
  /** Injected processing start for timing; defaults to Date.now(). */
  startedAt?: number;
}

/**
 * Run the full deterministic analysis. Always returns an `AnalysisResult`
 * (the HTTP layer decides the status code), including a data-insufficiency
 * E001 REJECT, which is a valid, billable, auditable decision.
 */
export function analyze(
  input: AnalyzeInput,
  policy: PolicyConfig,
  opts: EngineOptions = {},
): { result: AnalysisResult; signals: DerivedSignals } {
  const startedAt = opts.startedAt ?? Date.now();
  const now = opts.now ?? Date.now();
  const signals = deriveSignals(input);
  const audit_id = newAuditId(now);

  // ── Gate 1: data sufficiency (E001), a REJECT, not an HTTP error ──────
  if (signals.months_of_data < policy.min_data_months) {
    return {
      signals,
      result: {
        decision: 'REJECT',
        credit_limit: 0,
        risk_score: 0,
        confidence: 1,
        processing_time_ms: Math.max(0, Date.now() - startedAt),
        engine_version: policy.version,
        audit_id,
        reasons: [],
        rules_fired: [],
        flags: ['INSUFFICIENT_DATA'],
        error: {
          code: 'E001',
          message: 'Insufficient transaction history',
          detail: `Minimum ${policy.min_data_months} months of bank statement required. Only ${signals.months_of_data} month(s) detected. Request a full statement from the applicant.`,
        },
      },
    };
  }

  // ── Evaluate every rule against the derived signals ───────────────────
  const rules_fired: Rule[] = [];
  const positiveContribs: { rule: PolicyRule; weight: number }[] = [];
  const hardRejectFailures: PolicyRule[] = [];
  const reviewFailures: PolicyRule[] = [];
  const flags: string[] = [];
  let score = 0;

  for (const rule of policy.rules) {
    const signal = (signals as unknown as Record<string, number | string>)[rule.field];
    const skipped = signal === undefined || signal === null;
    const pass = skipped ? false: compare(signal, rule.op, rule.value);

    rules_fired.push({
      id: rule.id,
      name: rule.name,
      condition: `${rule.field} ${OP_SYMBOL[rule.op]} ${rule.value}`,
      result: pass,
      skipped,
    });

    if (skipped) {
      // A missing/renamed signal used to `continue` here, which silently
      // disabled every hard-reject gate that depended on it, a fail-open on
      // the one class of rule that must never fail open. Route to a human
      // instead: no auto-approve, no silent decline.
      if (rule.action === 'hard_reject') {
        reviewFailures.push(rule);
        flags.push(`missing_signal:${rule.field}`);
      }
      continue;
    }

    switch (rule.action) {
      case 'hard_reject':
        if (!pass) hardRejectFailures.push(rule);
        break;
      case 'score':
        if (pass) {
          score += rule.weight;
          positiveContribs.push({ rule, weight: rule.weight });
        }
        break;
      case 'review_flag':
        if (!pass) {
          reviewFailures.push(rule);
          flags.push(rule.id);
        }
        break;
    }
  }

  const risk_score = Math.max(0, Math.min(100, Math.round(score * 100)));

  // ── Decide: hard_reject > score band (with review_flag override) ───────
  let decision: AnalysisResult['decision'];
  if (hardRejectFailures.length > 0) {
    decision = 'REJECT';
  } else if (risk_score < policy.bands.review_min) {
    decision = 'REJECT';
  } else if (reviewFailures.length > 0 || risk_score < policy.bands.approve_min) {
    decision = 'REVIEW';
  } else {
    decision = 'APPROVE';
  }

  // ── Reasons: decision-first weighted drivers ──────────────────────────
  const reasons = buildReasons(decision, positiveContribs, hardRejectFailures, reviewFailures);

  const credit_limit =
    decision === 'REJECT' ? 0: computeCreditLimit(policy, signals.monthly_income, risk_score);

  const confidence = Number(
    Math.max(0.5, Math.min(0.99, 0.55 + signals.months_of_data * 0.06)).toFixed(2),
  );

  return {
    signals,
    result: {
      decision,
      credit_limit,
      risk_score,
      confidence,
      processing_time_ms: Math.max(0, Date.now() - startedAt),
      engine_version: policy.version,
      audit_id,
      reasons,
      rules_fired,
      flags,
    },
  };
}

function buildReasons(
  decision: AnalysisResult['decision'],
  positiveContribs: { rule: PolicyRule; weight: number }[],
  hardRejectFailures: PolicyRule[],
  reviewFailures: PolicyRule[],
): Reason[] {
  if (decision === 'REJECT' && hardRejectFailures.length > 0) {
    const w = Number((1 / hardRejectFailures.length).toFixed(2));
    return hardRejectFailures.map(rule => ({
      code: rule.id,
      label: rule.name,
      weight: w,
      detail: rule.explanation,
      sentiment: 'negative' as const,
    }));
  }

  const reasons: Reason[] = [];
  const top = [...positiveContribs].sort((a, b) => b.weight - a.weight).slice(0, 4);
  const sum = top.reduce((s, c) => s + c.weight, 0) || 1;
  for (const c of top) {
    reasons.push({
      code: c.rule.id,
      label: c.rule.name,
      weight: Number((c.weight / sum).toFixed(2)),
      detail: c.rule.explanation,
      sentiment: 'positive',
    });
  }

  // For REVIEW, surface the flag(s) that forced human review.
  if (decision === 'REVIEW') {
    for (const rule of reviewFailures.slice(0, 2)) {
      reasons.push({
        code: rule.id,
        label: rule.name,
        weight: 0,
        detail: rule.explanation,
        sentiment: 'neutral',
      });
    }
  }

  return reasons;
}
