/**
 * Regression tests for the hardening items from AUDIT-2026-06-13 that were
 * fixed after the pilot audit: fail-closed hard rejects (M2), audit-id entropy
 * (M3) and the transaction-volume cap (M4).
 */
import { describe, it, expect } from 'vitest';
import { analyze } from '../src/services/underwriting-engine';
import { validateAnalyzeRequest } from '../src/services/underwriting-validator';
import { loadPilotPolicy } from '../src/config/policy-loader';
import type { AnalyzeInput, PolicyConfig } from '../src/types/underwriting';

const { policy } = loadPilotPolicy();

const baseInput: AnalyzeInput = {
  applicant: { name: 'Test Borrower', pan: 'ABCPK1234D', monthly_income_declared: 45000 },
  bank_statement: {
    account_number: 'XXXX4521',
    bank: 'HDFC',
    period: '6 months',
    transactions: [
      { date: '2024-01-03', description: 'SALARY CREDIT - INFOSYS LTD', amount: 44800, type: 'credit', balance: 52300 },
      { date: '2024-01-07', description: 'EMI PAYMENT - BAJAJ FINANCE', amount: -8500, type: 'debit', balance: 43800 },
    ],
  },
  loan_request: { amount: 200000, tenure_months: 24, purpose: 'business_expansion' },
};

describe('M2: a hard-reject rule with a missing signal must not fail open', () => {
  it('routes to manual review instead of approving', () => {
    // Take the live policy and point one hard-reject rule at a field that the
    // engine cannot derive. Before the fix this rule was skipped entirely and
    // the file could still auto-approve.
    const brokenPolicy: PolicyConfig = {
...policy,
      rules: policy.rules.map((rule, index) =>
        index === 0 ? {...rule, action: 'hard_reject', field: 'signal_that_does_not_exist' }: rule,
      ),
    };

    const { result } = analyze(baseInput, brokenPolicy);

    expect(result.decision).toBe('REVIEW');
    expect(result.rules_fired.some((r) => r.skipped)).toBe(true);
    expect(result.flags).toContain('missing_signal:signal_that_does_not_exist');
  });
});

describe('M3, audit ids have enough entropy', () => {
  it('emits 64 bits of randomness per id and never collides in a burst', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 500; i++) {
      ids.add(analyze(baseInput, policy).result.audit_id);
    }
    expect(ids.size).toBe(500);

    const sample = [...ids][0];
    const suffix = sample.split('_').pop() as string;
    expect(suffix).toHaveLength(16); // 8 bytes hex
  });
});

describe('M4, transaction volume is capped', () => {
  it('rejects a statement with more transactions than the limit', () => {
    const huge: AnalyzeInput = {
...baseInput,
      bank_statement: {
...baseInput.bank_statement,
        transactions: Array.from({ length: 20001 }, (_, i) => ({
          date: '2024-01-03',
          description: `TXN ${i}`,
          amount: 100,
          type: 'credit' as const,
          balance: 1000,
        })),
      },
    };

    const validation = validateAnalyzeRequest(huge);
    expect(validation.ok).toBe(false);
    if (!validation.ok) {
      expect(validation.error.code).toBe('E413');
    }
  });

  it('still accepts a normal-sized statement', () => {
    expect(validateAnalyzeRequest(baseInput).ok).toBe(true);
  });
});
