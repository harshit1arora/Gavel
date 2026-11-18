import { z } from 'zod';
import { analyzeSignals } from './underwriting-engine';
import { AnalysisResult, DerivedSignals, PolicyConfig } from '../types/underwriting';

const numericFields = 'monthly_income emi_ratio emi_count emi_total avg_residual min_balance salary_count income_volatility months_of_data months_active transaction_count credit_count debit_count total_credits total_debits savings_ratio'.split(' ');
const nonnegative = z.number().finite().nonnegative();
const label = z.string().trim().min(1).max(500);
export const candidatePolicy = z.object({
  policy_id: label, version: label, pilot: label, min_data_months: nonnegative.int(),
  bands: z.object({ approve_min: nonnegative.max(100), review_min: nonnegative.max(100) })
    .refine(b => b.review_min <= b.approve_min, 'Review threshold exceeds approval threshold'),
  limit_formula: z.object({ method: z.literal('income_multiple'), income_multiple: nonnegative,
    score_weighting: z.boolean(), round_to_nearest: nonnegative, max_limit: nonnegative, min_limit: nonnegative })
    .refine(f => f.min_limit <= f.max_limit, 'Minimum limit exceeds maximum'),
  rules: z.array(z.object({ id: label, name: label, field: label,
    op: z.enum(['gte','lte','gt','lt','eq','neq']), value: z.union([z.number().finite(), label]),
    action: z.enum(['score','hard_reject','review_flag']), weight: nonnegative.max(1), explanation: label })
    .refine(r => r.field === 'income_type'
      ? ['eq','neq'].includes(r.op) && ['salary','variable'].includes(String(r.value))
      : numericFields.includes(r.field) && typeof r.value === 'number', 'Invalid signal or comparison'))
    .min(1).max(200).refine(rows => new Set(rows.map(r => r.id)).size === rows.length, 'Duplicate rule IDs'),
}).strict();

export function replayable(signals: Record<string, unknown> | undefined, result: AnalysisResult | undefined) {
  return signals && numericFields.every(field => typeof signals[field] === 'number' && Number.isFinite(signals[field])) &&
    ['salary','variable'].includes(String(signals.income_type)) && result &&
    ['APPROVE','REVIEW','REJECT'].includes(result.decision) && Number.isFinite(result.credit_limit) &&
    Number.isFinite(result.risk_score) && Array.isArray(result.rules_fired) && Array.isArray(result.reasons) && Array.isArray(result.flags);
}
function sameSettings(a: unknown, b: unknown) {
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return a === b;
  const left = Object.entries(a), right = Object.entries(b);
  return left.length === right.length && left.every(([key,value]) => Reflect.get(b,key) === value);
}

export function replayCase(id: string, signals: DerivedSignals, before: AnalysisResult, policy: PolicyConfig, original?: PolicyConfig) {
  const after = analyzeSignals(signals, policy).result;
  const oldRules = new Map(before.rules_fired.map(r => [r.id, r]));
  const newRules = new Map(after.rules_fired.map(r => [r.id, r]));
  const rules = Array.from(new Set([...oldRules.keys(), ...newRules.keys()])).flatMap(id => {
    const old = oldRules.get(id), next = newRules.get(id);
    const a = original?.rules.find(r => r.id === id), b = policy.rules.find(r => r.id === id);
    if (old?.condition === next?.condition && old?.result === next?.result && old?.skipped === next?.skipped &&
        (!a || (a.action === b?.action && a.weight === b?.weight))) return [];
    return [{ id, before: old || null, after: next || null, beforeAction: a?.action ?? null, afterAction: b?.action ?? null,
      beforeWeight: a?.weight ?? null, afterWeight: b?.weight ?? null }];
  });
  const compact = (r: AnalysisResult) => ({ decision: r.decision, score: r.risk_score, limit: r.credit_limit,
    reasons: r.reasons.map(v => v.code), flags: r.flags });
  return { id, before: compact(before), after: compact(after), rules,
    exposureDelta: (after.decision === 'APPROVE' ? after.credit_limit : 0) - (before.decision === 'APPROVE' ? before.credit_limit : 0),
    configurationChanges: original ? ['bands','limit_formula','min_data_months'].filter(
      key => !sameSettings(original[key as keyof PolicyConfig], policy[key as keyof PolicyConfig])) : null };
}
