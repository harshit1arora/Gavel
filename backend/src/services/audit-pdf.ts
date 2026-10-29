/**
 * Renders a one-page, regulator-ready audit PDF for a single underwriting
 * decision, from the immutable `audit_logs` record.
 *
 * The point of the artifact is the tamper-evident footer: a CRO hands this to
 * an RBI auditor and says "scan this Decision ID to verify the original record".
 * The footer stamps the audit_id, policy version, config hash and timestamp,
 * the exact coordinates needed to recompute the decision identically.
 *
 * Pure & synchronous: returns a Buffer. Uses jsPDF (already the project's PDF
 * library) which runs in Node and emits uncompressed, inspectable content.
 */

import { jsPDF } from 'jspdf';
import {
  AnalysisResult,
  DerivedSignals,
  ErrorResult,
  Reason,
  Rule,
} from '../types/underwriting';

export interface AuditPdfRecord {
  audit_id: string;
  generated_at: string; // ISO-8601 UTC
  decision: AnalysisResult['decision'];
  credit_limit: number;
  risk_score: number;
  confidence: number;
  engine_version: string;
  panMasked: string;
  bank?: string | null;
  period?: string | null;
  loan_request?: { amount?: number; tenure_months?: number; purpose?: string } | null;
  reasons: Reason[];
  rules_fired: Rule[];
  signals: DerivedSignals;
  policy_id: string;
  policy_version: string;
  config_hash: string;
  error?: ErrorResult;
}

const ORANGE: [number, number, number] = [249, 115, 22];
const GREEN: [number, number, number] = [16, 185, 129];
const RED: [number, number, number] = [239, 68, 68];
const AMBER: [number, number, number] = [245, 158, 11];
const INK: [number, number, number] = [10, 14, 26];
const MUTED: [number, number, number] = [100, 116, 139];
const HAIR: [number, number, number] = [210, 214, 220];

function decisionColor(decision: AuditPdfRecord['decision']): [number, number, number] {
  if (decision === 'APPROVE') return GREEN;
  if (decision === 'REJECT') return RED;
  return AMBER;
}

function decisionLabel(decision: AuditPdfRecord['decision']): string {
  if (decision === 'APPROVE') return 'APPROVED';
  if (decision === 'REJECT') return 'REJECTED';
  return 'REVIEW REQUIRED';
}

/** ₹ is not in jsPDF's standard WinAnsi font; "INR" is unambiguous for audit. */
function inr(n: number): string {
  return `INR ${Math.round(n).toLocaleString('en-IN')}`;
}

export function renderAuditPdf(rec: AuditPdfRecord): Buffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 15;
  let y = 16;

  const setColor = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);
  const sectionRule = (title: string) => {
    y += 3;
    doc.setDrawColor(HAIR[0], HAIR[1], HAIR[2]);
    doc.setLineWidth(0.2);
    doc.line(M, y, W - M, y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(MUTED);
    doc.text(title, M, y);
    y += 5;
  };

  // ── Header ─────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  setColor(ORANGE);
  doc.text('GAVEL', M, y);

  const dc = decisionColor(rec.decision);
  doc.setFontSize(18);
  setColor(dc);
  doc.text(decisionLabel(rec.decision), W - M, y, { align: 'right' });

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setColor(MUTED);
  doc.text('Underwriting Audit Record', M, y);
  doc.setFont('courier', 'normal');
  doc.text(`Audit ID: ${rec.audit_id}`, W - M, y, { align: 'right' });
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${rec.generated_at} UTC`, W - M, y, { align: 'right' });

  // ── Applicant ───────────────────────────────────────────────────────────
  sectionRule('APPLICANT');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setColor(INK);
  const loan = rec.loan_request || {};
  doc.text(`PAN: ${rec.panMasked} (masked)`, M, y);
  doc.text(
    `Bank: ${rec.bank || 'N/A'} Period: ${rec.period || 'N/A'}`,
    W / 2,
    y,
  );
  y += 5;
  doc.text(
    `Loan Requested: ${loan.amount != null ? inr(loan.amount): 'N/A'}` +
      ` Tenure: ${loan.tenure_months != null ? `${loan.tenure_months} months`: 'N/A'}` +
      ` Purpose: ${loan.purpose || 'N/A'}`,
    M,
    y,
  );

  // ── Decision summary ──────────────────────────────────────────────────────
  sectionRule('DECISION SUMMARY');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  setColor(INK);
  doc.text(`Credit Limit: ${inr(rec.credit_limit)}`, M, y);
  doc.text(`Risk Score: ${rec.risk_score} / 100`, W / 2, y);
  doc.text(`Confidence: ${Math.round(rec.confidence * 100)}%`, W - M, y, { align: 'right' });

  if (rec.error) {
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(RED);
    doc.text(`${rec.error.code}, ${rec.error.message}`, M, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setColor(MUTED);
    doc.text(doc.splitTextToSize(rec.error.detail, W - 2 * M), M, y);
    y += 4;
  }

  // ── Decision factors (weighted reason bars) ───────────────────────────────
  if (rec.reasons && rec.reasons.length > 0) {
    sectionRule('DECISION FACTORS');
    const barX = M + 70;
    const barMax = 45;
    for (const reason of rec.reasons) {
      const pct = Math.round((reason.weight || 0) * 100);
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      setColor(INK);
      doc.text(String(reason.code).slice(0, 22), M, y);

      // track + fill
      doc.setFillColor(232, 234, 238);
      doc.rect(barX, y - 2.6, barMax, 2.6, 'F');
      const rc =
        reason.sentiment === 'negative' ? RED: reason.sentiment === 'neutral' ? AMBER: GREEN;
      doc.setFillColor(rc[0], rc[1], rc[2]);
      doc.rect(barX, y - 2.6, Math.max(0.5, (barMax * pct) / 100), 2.6, 'F');

      doc.setFont('helvetica', 'normal');
      setColor(MUTED);
      doc.text(`${pct}%`, barX + barMax + 3, y);
      y += 5;

      if (reason.detail) {
        doc.setFontSize(7);
        setColor(MUTED);
        doc.text(doc.splitTextToSize(reason.detail, W - 2 * M), M + 2, y);
        y += 4;
      }
    }
  }

  // ── Rule ledger (all rules evaluated) ─────────────────────────────────────
  sectionRule(`RULE LEDGER (all ${rec.rules_fired.length})`);
  doc.setFontSize(7.5);
  const colId = M;
  const colName = M + 16;
  const colRes = M + 78;
  const colCond = M + 96;
  doc.setFont('helvetica', 'bold');
  setColor(MUTED);
  doc.text('ID', colId, y);
  doc.text('RULE', colName, y);
  doc.text('RESULT', colRes, y);
  doc.text('CONDITION', colCond, y);
  y += 3.6;

  for (const rule of rec.rules_fired) {
    if (y > H - 34) {
      doc.addPage();
      y = 18;
    }
    const status = rule.skipped ? 'SKIP': rule.result ? 'PASS': 'FAIL';
    const statusColor = rule.skipped ? MUTED: rule.result ? GREEN: RED;

    doc.setFont('courier', 'normal');
    setColor(INK);
    doc.text(rule.id, colId, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(rule.name).slice(0, 34), colName, y);
    doc.setFont('helvetica', 'bold');
    setColor(statusColor);
    doc.text(status, colRes, y);
    doc.setFont('courier', 'normal');
    setColor(MUTED);
    doc.text(String(rule.condition).slice(0, 40), colCond, y);
    y += 3.8;
  }

  // ── Derived signals ───────────────────────────────────────────────────────
  if (y > H - 70) {
    doc.addPage();
    y = 18;
  }
  sectionRule('DERIVED SIGNALS');
  const s = rec.signals;
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  setColor(INK);
  const sig: string[] = [
    `monthly_income: ${inr(s.monthly_income)}`,
    `emi_ratio: ${s.emi_ratio}`,
    `salary_credit_count: ${s.salary_count}`,
    `avg_residual_balance: ${inr(s.avg_residual)}`,
    `emi_count: ${s.emi_count}`,
    `income_type: ${s.income_type}`,
    `months_of_data: ${s.months_of_data}`,
    `savings_ratio: ${s.savings_ratio}`,
  ];
  for (let i = 0; i < sig.length; i += 2) {
    doc.text(sig[i], M, y);
    if (sig[i + 1]) doc.text(sig[i + 1], W / 2, y);
    y += 4.2;
  }

  // ── Policy metadata ───────────────────────────────────────────────────────
  sectionRule('POLICY METADATA');
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  setColor(INK);
  doc.text(`Policy: ${rec.policy_id} v${rec.policy_version}`, M, y);
  y += 4.2;
  doc.text(`Config Hash: sha256:${rec.config_hash}`, M, y);
  y += 4.2;
  doc.text(`Engine: Gavel v${rec.engine_version}`, M, y);

  // ── Tamper-evident footer (pinned to bottom of last page) ──────────────────
  const footY = H - 22;
  doc.setDrawColor(HAIR[0], HAIR[1], HAIR[2]);
  doc.setLineWidth(0.2);
  doc.line(M, footY - 4, W - M, footY - 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  setColor(MUTED);
  doc.text(
    'This document was generated from an immutable audit record and cannot be modified after creation.',
    M,
    footY,
  );
  doc.setFont('courier', 'normal');
  doc.text(
    `Decision ID: ${rec.audit_id} | Policy: ${rec.policy_version} | Hash: ${rec.config_hash} | Generated: ${rec.generated_at} UTC`,
    M,
    footY + 4,
  );
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Verify at: api.trygavel.com/v1/underwriting/audit/${rec.audit_id}`,
    M,
    footY + 8,
  );
  doc.text('RBI/2022-23/111 compliant | (c) 2026 Gavel AI', M, footY + 12);

  const ab = doc.output('arraybuffer');
  return Buffer.from(ab);
}
