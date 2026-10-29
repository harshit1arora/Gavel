import { describe, it, expect } from 'vitest';
import { analyze, deriveSignals, computeCreditLimit } from '../src/services/underwriting-engine';
import { validateAnalyzeRequest } from '../src/services/underwriting-validator';
import { loadPilotPolicy } from '../src/config/policy-loader';
import { AnalyzeInput } from '../src/types/underwriting';

const { policy } = loadPilotPolicy();

// The five canonical personas, same payloads the frontend mock ships with
// (src/lib/mock-engine.ts PAYLOADS). The engine must reproduce their expected
// decisions from the real transaction data, not from hardcoded branches.
const PAYLOADS: Record<string, { input: AnalyzeInput; expected: string }> = {
  strong: {
    expected: 'APPROVE',
    input: {
      applicant: { name: 'Rajesh Kumar', pan: 'ABCPK1234D', monthly_income_declared: 45000 },
      bank_statement: {
        account_number: 'XXXX4521',
        bank: 'HDFC',
        period: '6 months',
        transactions: [
          { date: '2024-01-03', description: 'SALARY CREDIT - INFOSYS LTD', amount: 44800, type: 'credit', balance: 52300 },
          { date: '2024-01-07', description: 'EMI PAYMENT - BAJAJ FINANCE', amount: -8500, type: 'debit', balance: 43800 },
          { date: '2024-01-15', description: 'UPI - SWIGGY', amount: -340, type: 'debit', balance: 43460 },
        ],
      },
      loan_request: { amount: 200000, tenure_months: 24, purpose: 'business_expansion' },
    },
  },
  highrisk: {
    expected: 'REJECT',
    input: {
      applicant: { name: 'Priya Sharma', pan: 'XYZPS5678K', monthly_income_declared: 38000 },
      bank_statement: {
        account_number: 'XXXX8832',
        bank: 'SBI',
        period: '6 months',
        transactions: [
          { date: '2024-01-05', description: 'SALARY NEFT', amount: 38000, type: 'credit', balance: 12000 },
          { date: '2024-01-06', description: 'EMI - HDFC BANK', amount: -15000, type: 'debit', balance: 0 },
          { date: '2024-01-08', description: 'EMI - FULLERTON', amount: -12400, type: 'debit', balance: 0 },
        ],
      },
      loan_request: { amount: 300000, tenure_months: 36, purpose: 'personal' },
    },
  },
  review: {
    expected: 'REVIEW',
    input: {
      applicant: { name: 'Amit Verma', pan: 'MNOPV9012R', monthly_income_declared: 35000 },
      bank_statement: {
        account_number: 'XXXX2291',
        bank: 'ICICI',
        period: '6 months',
        transactions: [
          { date: '2024-01-10', description: 'TRANSFER CREDIT', amount: 55000, type: 'credit', balance: 61000 },
          { date: '2024-02-12', description: 'CLIENT PAYMENT', amount: 18000, type: 'credit', balance: 22000 },
          { date: '2024-03-08', description: 'BUSINESS RECEIPT', amount: 42000, type: 'credit', balance: 48000 },
        ],
      },
      loan_request: { amount: 150000, tenure_months: 18, purpose: 'working_capital' },
    },
  },
  threshold: {
    expected: 'REJECT',
    input: {
      applicant: { name: 'Sunita Devi', pan: 'PQRSD3456T', monthly_income_declared: 16000 },
      bank_statement: {
        account_number: 'XXXX6610',
        bank: 'PNB',
        period: '6 months',
        transactions: [
          { date: '2024-01-01', description: 'SALARY', amount: 16500, type: 'credit', balance: 4200 },
        ],
      },
      loan_request: { amount: 50000, tenure_months: 12, purpose: 'personal' },
    },
  },
  insufficient: {
    expected: 'REJECT',
    input: {
      applicant: { name: 'Karan Mehta', pan: 'ABCKM7890Z', monthly_income_declared: 40000 },
      bank_statement: {
        account_number: 'XXXX3301',
        bank: 'AXIS',
        period: '1 month',
        transactions: [
          { date: '2024-01-02', description: 'SALARY CREDIT', amount: 40000, type: 'credit', balance: 41000 },
        ],
      },
      loan_request: { amount: 100000, tenure_months: 12, purpose: 'education' },
    },
  },
};

describe('underwriting-engine, persona decisions', () => {
  for (const [id, { input, expected }] of Object.entries(PAYLOADS)) {
    it(`decides ${expected} for the "${id}" persona`, () => {
      const { result } = analyze(input, policy);
      expect(result.decision).toBe(expected);
    });
  }

  it('returns a deterministic result for the same input', () => {
    // audit_id and processing_time_ms are intentionally non-deterministic
    // (unique id + wall-clock); the decision content must be identical.
    const norm = (r: ReturnType<typeof analyze>['result']) => ({
...r,
      audit_id: '',
      processing_time_ms: 0,
    });
    const a = analyze(PAYLOADS.strong.input, policy);
    const b = analyze(PAYLOADS.strong.input, policy);
    expect(norm(a.result)).toEqual(norm(b.result));
  });
});

describe('underwriting-engine: E001 data sufficiency', () => {
  it('returns an E001 REJECT (not an HTTP error) for a thin file', () => {
    const { result } = analyze(PAYLOADS.insufficient.input, policy);
    expect(result.decision).toBe('REJECT');
    expect(result.error?.code).toBe('E001');
    expect(result.credit_limit).toBe(0);
    expect(result.rules_fired).toHaveLength(0);
  });
});

describe('underwriting-engine, hard_reject overrides score', () => {
  it('rejects the high-EMI persona even though its score is in the review band', () => {
    const { result } = analyze(PAYLOADS.highrisk.input, policy);
    expect(result.decision).toBe('REJECT');
    // The DTI hard ceiling (R002) is the failing gate.
    expect(result.rules_fired.find(r => r.id === 'R002')?.result).toBe(false);
    // Score alone would not have rejected (>= review_min), the gate did.
    expect(result.risk_score).toBeGreaterThanOrEqual(policy.bands.review_min);
  });

  it('rejects the below-floor income persona via R001', () => {
    const { result } = analyze(PAYLOADS.threshold.input, policy);
    expect(result.decision).toBe('REJECT');
    expect(result.rules_fired.find(r => r.id === 'R001')?.result).toBe(false);
  });
});

describe('underwriting-engine, credit limit follows the formula', () => {
  it('computes credit_limit from the policy limit_formula for an approval', () => {
    const { result, signals } = analyze(PAYLOADS.strong.input, policy);
    expect(result.decision).toBe('APPROVE');
    const expectedLimit = computeCreditLimit(policy, signals.monthly_income, result.risk_score);
    expect(result.credit_limit).toBe(expectedLimit);
    expect(result.credit_limit).toBeGreaterThan(0);
  });

  it('zeroes the credit_limit on a REJECT', () => {
    const { result } = analyze(PAYLOADS.highrisk.input, policy);
    expect(result.credit_limit).toBe(0);
  });
});

describe('underwriting-engine, derived signals', () => {
  it('derives a salaried, low-DTI profile for the strong persona', () => {
    const s = deriveSignals(PAYLOADS.strong.input);
    expect(s.income_type).toBe('salary');
    expect(s.monthly_income).toBe(44800);
    expect(s.emi_ratio).toBeLessThanOrEqual(0.5);
    expect(s.emi_count).toBe(1);
    expect(s.months_of_data).toBe(6);
  });

  it('flags variable income for the self-employed review persona', () => {
    const s = deriveSignals(PAYLOADS.review.input);
    expect(s.income_type).toBe('variable');
    expect(s.salary_count).toBe(0);
  });

  it('detects two EMIs and a high DTI for the high-risk persona', () => {
    const s = deriveSignals(PAYLOADS.highrisk.input);
    expect(s.emi_count).toBe(2);
    expect(s.emi_ratio).toBeGreaterThan(0.6);
  });
});

describe('underwriting-validator, transport contract', () => {
  it('accepts a well-formed payload', () => {
    expect(validateAnalyzeRequest(PAYLOADS.strong.input).ok).toBe(true);
  });

  it('rejects a non-object body (e.g. a raw PDF string)', () => {
    const r = validateAnalyzeRequest('%PDF-1.7...');
    expect(r.ok).toBe(false);
    expect(r.error?.detail).toMatch(/parse/i);
  });

  it('rejects a bad PAN format', () => {
    const bad = JSON.parse(JSON.stringify(PAYLOADS.strong.input));
    bad.applicant.pan = '12345ABCDE';
    const r = validateAnalyzeRequest(bad);
    expect(r.ok).toBe(false);
    expect(r.error?.message).toMatch(/PAN/);
  });

  it('rejects an empty transactions array', () => {
    const bad = JSON.parse(JSON.stringify(PAYLOADS.strong.input));
    bad.bank_statement.transactions = [];
    expect(validateAnalyzeRequest(bad).ok).toBe(false);
  });
});

describe('policy-loader', () => {
  it('loads the pilot policy with 24 rules and a stable hash', () => {
    const a = loadPilotPolicy();
    const b = loadPilotPolicy();
    expect(a.policy.rules).toHaveLength(24);
    expect(a.hash).toHaveLength(16);
    expect(a.hash).toBe(b.hash);
  });
});
