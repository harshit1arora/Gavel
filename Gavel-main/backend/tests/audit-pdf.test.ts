import { describe, it, expect } from 'vitest';
import { renderAuditPdf, AuditPdfRecord } from '../src/services/audit-pdf';
import { analyze } from '../src/services/underwriting-engine';
import { loadPilotPolicy } from '../src/config/policy-loader';
import { AnalyzeInput } from '../src/types/underwriting';

const { policy, hash } = loadPilotPolicy();

const STRONG_INPUT: AnalyzeInput = {
  applicant: { name: 'Rajesh Kumar', pan: 'ABCPK1234D', monthly_income_declared: 45000 },
  bank_statement: {
    account_number: 'XXXX4521',
    bank: 'HDFC Bank',
    period: '6 months',
    transactions: [
      { date: '2024-01-03', description: 'SALARY CREDIT - INFOSYS LTD', amount: 44800, type: 'credit', balance: 52300 },
      { date: '2024-01-07', description: 'EMI PAYMENT - BAJAJ FINANCE', amount: -8500, type: 'debit', balance: 43800 },
      { date: '2024-01-15', description: 'UPI - SWIGGY', amount: -340, type: 'debit', balance: 43460 },
    ],
  },
  loan_request: { amount: 200000, tenure_months: 24, purpose: 'business_expansion' },
};

function buildRecord(): AuditPdfRecord {
  const { result, signals } = analyze(STRONG_INPUT, policy);
  return {
    audit_id: result.audit_id,
    generated_at: '2024-01-03 14:23:01',
    decision: result.decision,
    credit_limit: result.credit_limit,
    risk_score: result.risk_score,
    confidence: result.confidence,
    engine_version: result.engine_version,
    panMasked: '******234D',
    bank: 'HDFC Bank',
    period: '6 months',
    loan_request: STRONG_INPUT.loan_request,
    reasons: result.reasons,
    rules_fired: result.rules_fired,
    signals,
    policy_id: policy.policy_id,
    policy_version: policy.version,
    config_hash: hash,
    error: result.error,
  };
}

describe('renderAuditPdf', () => {
  it('produces a valid PDF buffer (starts with %PDF)', () => {
    const buf = renderAuditPdf(buildRecord());
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.slice(0, 5).toString('latin1')).toBe('%PDF-');
    expect(buf.length).toBeGreaterThan(1000);
  });

  it('contains the audit_id string', () => {
    const rec = buildRecord();
    const buf = renderAuditPdf(rec);
    expect(buf.includes(Buffer.from(rec.audit_id))).toBe(true);
  });

  it('contains all 24 rule rows from the ledger', () => {
    const rec = buildRecord();
    const buf = renderAuditPdf(rec);
    expect(rec.rules_fired).toHaveLength(24);
    for (const rule of rec.rules_fired) {
      expect(buf.includes(Buffer.from(rule.id))).toBe(true);
    }
  });

  it('masks the PAN and never embeds the raw PAN', () => {
    const buf = renderAuditPdf(buildRecord());
    expect(buf.includes(Buffer.from('******234D'))).toBe(true);
    expect(buf.includes(Buffer.from('ABCPK1234D'))).toBe(false);
  });

  it('stamps the config hash in the tamper-evident footer', () => {
    const rec = buildRecord();
    const buf = renderAuditPdf(rec);
    expect(rec.config_hash.length).toBe(16);
    expect(buf.includes(Buffer.from(rec.config_hash))).toBe(true);
    expect(buf.includes(Buffer.from('immutable audit record'))).toBe(true);
    expect(buf.includes(Buffer.from(`api.trygavel.com/v1/underwriting/audit/${rec.audit_id}`))).toBe(true);
  });

  it('renders the decision verdict', () => {
    const rec = buildRecord();
    const buf = renderAuditPdf(rec);
    expect(rec.decision).toBe('APPROVE');
    expect(buf.includes(Buffer.from('APPROVED'))).toBe(true);
  });
});
