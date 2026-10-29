import { describe, it, expect } from "vitest";
import { analyze, DEFAULT_POLICY, inr } from "@/lib/engine/evaluate";
import { deriveSignals } from "@/lib/engine/signals";
import { parseStatementText, parseDate } from "@/lib/engine/statement-parser";
import { SAMPLE_APPLICANTS, sampleStatementText } from "@/lib/engine/samples";

describe("statement parser", () => {
  it("parses the common Indian date formats", () => {
    expect(parseDate("01/04/2024")).toBe("2024-04-01");
    expect(parseDate("01-04-24")).toBe("2024-04-01");
    expect(parseDate("2024-04-01")).toBe("2024-04-01");
    expect(parseDate("01 Apr 2024")).toBe("2024-04-01");
    expect(parseDate("not a date")).toBeNull();
  });

  it("round-trips a generated statement without losing rows", () => {
    const applicant = SAMPLE_APPLICANTS[0];
    const parsed = parseStatementText(sampleStatementText(applicant));

    expect(parsed.transactions.length).toBe(applicant.transactions.length);
    expect(parsed.confidence).toBeGreaterThan(0.9);

    const credits = parsed.transactions.filter((t) => t.type === "credit").length;
    const originalCredits = applicant.transactions.filter((t) => t.type === "credit").length;
    expect(credits).toBe(originalCredits);
  });

  it("reports a warning instead of throwing on unreadable text", () => {
    const parsed = parseStatementText("no transactions here at all");
    expect(parsed.transactions).toHaveLength(0);
    expect(parsed.warnings[0]).toMatch(/No transactions/i);
  });
});

describe("signal derivation", () => {
  it("derives income and EMI ratio from transactions, not from declarations", () => {
    const applicant = SAMPLE_APPLICANTS[0];
    const signals = deriveSignals(applicant.transactions);

    expect(signals.monthly_income).toBeGreaterThan(40000);
    expect(signals.monthly_income).toBeLessThan(48000);
    expect(signals.income_type).toBe("salary");
    expect(signals.emi_ratio).toBeGreaterThan(0);
    expect(signals.emi_ratio).toBeLessThan(0.5);
  });
});

describe("decision engine", () => {
  const results = SAMPLE_APPLICANTS.map((a) => ({
    name: a.name,
    ...analyze({ transactions: a.transactions, period: `${a.months} months` }),
  }));

  it("produces a decision for every applicant", () => {
    for (const r of results) {
      expect(["APPROVE", "REVIEW", "REJECT"]).toContain(r.decision);
      expect(r.audit_id).toMatch(/^gavel_\d+_[0-9a-f]{16}$/);
    }
  });

  it("approves the strong salaried profile and rejects the over-leveraged one", () => {
    const rajesh = results.find((r) => r.name === "Rajesh Kumar")!;
    const priya = results.find((r) => r.name === "Priya Sharma")!;

    expect(rajesh.decision).toBe("APPROVE");
    expect(rajesh.credit_limit).toBeGreaterThan(0);
    expect(priya.decision).toBe("REJECT");
    expect(priya.credit_limit).toBe(0);
  });

  it("is deterministic for the same input", () => {
    const applicant = SAMPLE_APPLICANTS[2];
    const a = analyze({ transactions: applicant.transactions, period: `${applicant.months} months` });
    const b = analyze({ transactions: applicant.transactions, period: `${applicant.months} months` });
    expect(a.decision).toBe(b.decision);
    expect(a.risk_score).toBe(b.risk_score);
    expect(a.rules_fired).toEqual(b.rules_fired);
  });

  it("refuses to decide on too little history", () => {
    const applicant = SAMPLE_APPLICANTS[0];
    const lastMonth = applicant.transactions[applicant.transactions.length - 1].date.slice(0, 7);
    const oneMonth = analyze({
      transactions: applicant.transactions.filter((t) => t.date.startsWith(lastMonth)),
    });
    expect(oneMonth.decision).toBe("REJECT");
    expect(oneMonth.error?.code).toBe("E001");
  });

  it("fails closed when a hard-reject signal is missing", () => {
    const policy = {
      ...DEFAULT_POLICY,
      rules: DEFAULT_POLICY.rules.map((r, i) =>
        i === 0 ? { ...r, action: "hard_reject" as const, field: "signal_that_does_not_exist" } : r,
      ),
    };
    const result = analyze({ transactions: SAMPLE_APPLICANTS[0].transactions, period: "6 months" }, policy);
    expect(result.decision).not.toBe("APPROVE");
    expect(result.flags.some((f) => f.startsWith("missing_signal:"))).toBe(true);
  });

  it("formats rupees the Indian way", () => {
    expect(inr(125000)).toContain("1,25,000");
  });
});
