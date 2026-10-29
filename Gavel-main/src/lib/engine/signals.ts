import type { Signals, Txn } from "./types";

/**
 * Signal derivation: the auditable numbers every policy rule is evaluated
 * against. A faithful port of `backend/src/services/underwriting-engine.ts`
 * so browser decisions and API decisions agree.
 */

const SALARY_RE = /salary|payroll|stipend|wages|sal cr|sal credit/i;
const EMI_RE = /emi|\bloan\b|finance|repayment|installment|instalment|equated/i;

export function monthKey(dateStr: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(dateStr);
  if (m) return `${m[1]}-${m[2]}`;
  const d = new Date(dateStr);
  if (!Number.isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  return dateStr;
}

function coefficientOfVariation(values: number[]): number {
  const nonZero = values.filter((v) => v > 0);
  if (nonZero.length < 2) return 0;
  const mean = nonZero.reduce((a, b) => a + b, 0) / nonZero.length;
  if (mean <= 0) return 0;
  const variance = nonZero.reduce((s, v) => s + (v - mean) ** 2, 0) / nonZero.length;
  return Math.sqrt(variance) / mean;
}

function parsePeriodMonths(period?: string): number | null {
  if (!period) return null;
  const m = /(\d+)\s*month/i.exec(period);
  return m ? parseInt(m[1], 10): null;
}

export function deriveSignals(transactions: Txn[], period?: string): Signals {
  const txns = transactions.filter((t) => Number.isFinite(t.amount) && t.amount !== 0);
  const credits = txns.filter((t) => t.type === "credit");
  const debits = txns.filter((t) => t.type === "debit");

  const salaryCredits = credits.filter((t) => SALARY_RE.test(t.description || ""));
  const emiDebits = debits.filter((t) => EMI_RE.test(t.description || ""));

  const distinctTxnMonths = new Set(txns.map((t) => monthKey(t.date))).size;
  const distinctCreditMonths = new Set(credits.map((t) => monthKey(t.date))).size || 1;
  const months_of_data = parsePeriodMonths(period) ?? distinctTxnMonths;
  const months_active = Math.max(distinctTxnMonths, 1);

  const total_credits = credits.reduce((s, t) => s + t.amount, 0);
  const total_debits = debits.reduce((s, t) => s + t.amount, 0);

  const salary_count = salaryCredits.length;
  const income_type: Signals["income_type"] = salary_count > 0 ? "salary": "variable";
  const monthly_income =
    salary_count > 0
      ? salaryCredits.reduce((s, t) => s + t.amount, 0) / salary_count
: total_credits / distinctCreditMonths;

  const emi_total = emiDebits.reduce((s, t) => s + t.amount, 0);
  const emi_monthly = emi_total / months_active;
  const emi_ratio = monthly_income > 0 ? emi_monthly / monthly_income: 0;
  const emi_count = new Set(emiDebits.map((t) => (t.description || "").trim())).size;

  const balances = txns.map((t) => t.balance).filter((b): b is number => typeof b === "number");
  const avg_residual = balances.length ? balances.reduce((s, b) => s + b, 0) / balances.length: 0;
  const min_balance = balances.length ? Math.min(...balances): 0;

  const byMonth = new Map<string, number>();
  for (const t of credits) {
    const k = monthKey(t.date);
    byMonth.set(k, (byMonth.get(k) || 0) + t.amount);
  }
  const income_volatility = coefficientOfVariation([...byMonth.values()]);
  const savings_ratio = total_credits > 0 ? (total_credits - total_debits) / total_credits: 0;

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
