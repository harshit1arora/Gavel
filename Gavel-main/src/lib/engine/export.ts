import jsPDF from "jspdf";
import type { DecisionResult } from "./types";

const inrPlain = (v: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(v || 0));

/**
 * One-page decision record: the thing a credit team files.
 * Generated in the browser, so the applicant's data never leaves it.
 */
export function downloadDecisionPdf(result: DecisionResult, meta: { applicant: string; pan?: string }): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  let y = 18;

  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);
  doc.text("GAVEL: CREDIT DECISION RECORD", 15, y);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  doc.text("Open-source underwriting engine · deterministic · reproducible", 15, y);
  y += 10;

  const decisionColor: Record<string, [number, number, number]> = {
    APPROVE: [16, 140, 90],
    REVIEW: [190, 130, 20],
    REJECT: [190, 50, 50],
  };
  const c = decisionColor[result.decision] ?? [80, 80, 80];
  doc.setFillColor(c[0], c[1], c[2]);
  doc.rect(15, y, w - 30, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text(`${result.decision} · risk ${result.risk_score}/100`, 19, y + 9);
  doc.text(`Limit ₹${inrPlain(result.credit_limit)}`, w - 19, y + 9, { align: "right" });
  y += 22;

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9);
  const rows: [string, string][] = [
    ["Applicant", meta.applicant],
    ["PAN", meta.pan ? `******${meta.pan.slice(-4)}`: ", "],
    ["Audit ID", result.audit_id],
    ["Policy", `${result.policy_id} v${result.engine_version}`],
    ["Confidence", `${Math.round(result.confidence * 100)}%`],
    ["Computed in", `${result.processing_time_ms} ms`],
  ];
  for (const [k, v] of rows) {
    doc.setTextColor(120, 120, 120);
    doc.text(k, 15, y);
    doc.setTextColor(30, 30, 30);
    doc.text(String(v), 60, y);
    y += 5.5;
  }

  y += 4;
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  doc.text("Derived signals", 15, y);
  y += 5;
  doc.setFontSize(8.5);
  const s = result.signals;
  const signalRows: [string, string][] = [
    ["Monthly income", `₹${inrPlain(s.monthly_income)}`],
    ["Income type", s.income_type],
    ["EMI ratio", `${(s.emi_ratio * 100).toFixed(1)}%`],
    ["Active EMIs", String(s.emi_count)],
    ["Salary credits", String(s.salary_count)],
    ["Avg residual balance", `₹${inrPlain(s.avg_residual)}`],
    ["Min balance", `₹${inrPlain(s.min_balance)}`],
    ["Savings ratio", `${(s.savings_ratio * 100).toFixed(1)}%`],
    ["Months of data", String(s.months_of_data)],
    ["Transactions", String(s.transaction_count)],
  ];
  signalRows.forEach(([k, v], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    doc.setTextColor(120, 120, 120);
    doc.text(k, 15 + col * 92, y + row * 5);
    doc.setTextColor(30, 30, 30);
    doc.text(v, 60 + col * 92, y + row * 5);
  });
  y += Math.ceil(signalRows.length / 2) * 5 + 6;

  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  doc.text("Rules fired", 15, y);
  y += 5;
  doc.setFontSize(8);
  for (const r of result.rules_fired) {
    if (y > 275) {
      doc.addPage();
      y = 18;
    }
    const status = r.skipped ? "SKIP": r.result ? "PASS": "FAIL";
    doc.setTextColor(r.skipped ? 150: r.result ? 20: 180, r.skipped ? 150: r.result ? 120: 40, r.skipped ? 150: r.result ? 60: 40);
    doc.text(status, 15, y);
    doc.setTextColor(40, 40, 40);
    doc.text(`${r.id} ${r.name} (${r.condition})`, 30, y);
    y += 4.6;
  }

  y += 4;
  doc.setFontSize(7.5);
  doc.setTextColor(140, 140, 140);
  const note = doc.splitTextToSize(
    "This decision was computed in the browser by the open-source Gavel engine using the policy named above. The same inputs and policy always produce the same decision and the same audit id. Not a credit bureau report; not financial advice.",
    w - 30,
  );
  doc.text(note, 15, y);

  doc.save(`gavel-decision-${result.audit_id}.pdf`);
}
