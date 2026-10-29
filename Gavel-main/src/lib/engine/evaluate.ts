import type {
  AnalyzeInput,
  DecisionResult,
  DecisionType,
  Op,
  PolicyConfig,
  PolicyRule,
  Reason,
  RuleFired,
  Signals,
} from "./types";
import { deriveSignals } from "./signals";
import pilotPolicy from "@/data/policies/pilot-acme.json";

export const DEFAULT_POLICY = pilotPolicy as unknown as PolicyConfig;

const OP_SYMBOL: Record<Op, string> = {
  gte: ">=",
  lte: "<=",
  gt: ">",
  lt: "<",
  eq: "==",
  neq: "!=",
};

function compare(signal: number | string, op: Op, value: number | string): boolean {
  if (typeof value === "string" || typeof signal === "string") {
    const a = String(signal);
    const b = String(value);
    if (op === "eq") return a === b;
    if (op === "neq") return a !== b;
    return false;
  }
  switch (op) {
    case "gte":
      return signal >= value;
    case "lte":
      return signal <= value;
    case "gt":
      return signal > value;
    case "lt":
      return signal < value;
    case "eq":
      return signal === value;
    case "neq":
      return signal !== value;
    default:
      return false;
  }
}

function auditId(): string {
  const bytes = new Uint8Array(8);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `gavel_${Date.now()}_${hex}`;
}

function computeCreditLimit(policy: PolicyConfig, income: number, score: number): number {
  const f = policy.limit_formula;
  const base = income * f.income_multiple;
  const weighted = f.score_weighting ? base * (score / 100) : base;
  const step = f.round_to_nearest ?? 10000;
  const rounded = Math.round(weighted / step) * step;
  return Math.max(f.min_limit ?? 0, Math.min(f.max_limit ?? Infinity, rounded));
}

function reasonFor(rule: PolicyRule, sentiment: Reason["sentiment"]): Reason {
  return {
    code: rule.id,
    label: rule.name,
    weight: rule.weight,
    sentiment,
    detail: rule.explanation || `${rule.field} ${OP_SYMBOL[rule.op]} ${rule.value}`,
  };
}

/**
 * Deterministic evaluation. Same (transactions, policy) in ⇒ same decision out,
 * which is what makes a past decision reproducible for an audit.
 */
export function analyze(input: AnalyzeInput, policy: PolicyConfig = DEFAULT_POLICY): DecisionResult {
  const startedAt = Date.now();
  const signals: Signals = deriveSignals(input.transactions, input.period);

  const base = {
    engine_version: policy.version,
    policy_id: policy.policy_id,
    audit_id: auditId(),
    signals,
    rules_fired: [] as RuleFired[],
    reasons: [] as Reason[],
    flags: [] as string[],
  };

  if (signals.months_of_data < policy.min_data_months) {
    return {
      ...base,
      decision: "REJECT",
      credit_limit: 0,
      risk_score: 0,
      confidence: 1,
      processing_time_ms: Math.max(0, Date.now() - startedAt),
      error: {
        code: "E001",
        message: "Insufficient transaction history",
        detail: `Policy requires at least ${policy.min_data_months} months of statement data; ${signals.months_of_data} month(s) detected. Upload a longer statement.`,
      },
    };
  }

  const rules_fired: RuleFired[] = [];
  const positiveContribs: { rule: PolicyRule; weight: number }[] = [];
  const hardRejectFailures: PolicyRule[] = [];
  const reviewFailures: PolicyRule[] = [];
  const flags: string[] = [];
  let score = 0;

  for (const rule of policy.rules) {
    const signal = (signals as unknown as Record<string, number | string>)[rule.field];
    const skipped = signal === undefined || signal === null;
    const pass = skipped ? false : compare(signal, rule.op, rule.value);

    rules_fired.push({
      id: rule.id,
      name: rule.name,
      condition: `${rule.field} ${OP_SYMBOL[rule.op]} ${rule.value}`,
      result: pass,
      skipped,
      explanation: rule.explanation,
    });

    if (skipped) {
      // Never fail open on a hard reject: a missing signal means we cannot
      // prove the applicant is safe, so a human decides.
      if (rule.action === "hard_reject") {
        reviewFailures.push(rule);
        flags.push(`missing_signal:${rule.field}`);
      }
      continue;
    }

    switch (rule.action) {
      case "hard_reject":
        if (!pass) hardRejectFailures.push(rule);
        break;
      case "score":
        if (pass) {
          score += rule.weight;
          positiveContribs.push({ rule, weight: rule.weight });
        }
        break;
      case "review_flag":
        if (!pass) {
          reviewFailures.push(rule);
          flags.push(rule.id);
        }
        break;
    }
  }

  const risk_score = Math.max(0, Math.min(100, Math.round(score * 100)));

  let decision: DecisionType;
  if (hardRejectFailures.length > 0) decision = "REJECT";
  else if (risk_score < policy.bands.review_min) decision = "REJECT";
  else if (reviewFailures.length > 0 || risk_score < policy.bands.approve_min) decision = "REVIEW";
  else decision = "APPROVE";

  const reasons: Reason[] = [
    ...hardRejectFailures.map((r) => reasonFor(r, "negative")),
    ...reviewFailures.map((r) => reasonFor(r, "negative")),
    ...positiveContribs
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 4)
      .map(({ rule }) => reasonFor(rule, "positive")),
  ];

  const credit_limit = decision === "REJECT" ? 0 : computeCreditLimit(policy, signals.monthly_income, risk_score);
  const confidence = Number(
    Math.max(0.5, Math.min(0.99, 0.55 + signals.months_of_data * 0.06)).toFixed(2),
  );

  return {
    ...base,
    decision,
    credit_limit,
    risk_score,
    confidence,
    processing_time_ms: Math.max(0, Date.now() - startedAt),
    reasons,
    rules_fired,
    flags,
  };
}

/** Rupee formatting used across the UI (Indian grouping). */
export const inr = (value: number): string =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    Math.round(value || 0),
  );
