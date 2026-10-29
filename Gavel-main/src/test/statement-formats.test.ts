import { describe, it, expect } from "vitest";
import { parseStatementText } from "@/lib/engine/statement-parser";
import { analyze } from "@/lib/engine/evaluate";

/**
 * The parser has to read the layouts Indian banks actually emit. Each case is a
 * real-world shape: column order, separators and date formats all differ.
 */
const CASES: Record<string, { text: string; rows: number; credits: number }> = {
  "HDFC: amount, balance, Cr/Dr suffix": {
    rows: 4,
    credits: 2,
    text: [
      "03/05/2026  SALARY CREDIT - INFOSYS LTD   44,800.00   86,762.00 Cr",
      "07/05/2026  EMI BAJAJ FINANCE               8,500.00   78,262.00 Dr",
      "12/05/2026  UPI-SWIGGY                        640.00   77,622.00 Dr",
      "03/06/2026  SALARY CREDIT - INFOSYS LTD    44,900.00  122,522.00 Cr",
    ].join("\n"),
  },
  "ICICI: pipe separated with trailing marker": {
    rows: 4,
    credits: 2,
    text: [
      "03/05/2026|BY TRANSFER:NEFT|44,800.00|86,762.00|Cr",
      "07/05/2026|EMI BAJAJ FINANCE|8,500.00|78,262.00|Dr",
      "12/05/2026|UPI-SWIGGY|640.00|77,622.00|Dr",
      "03/06/2026|SALARY CREDIT|44,900.00|122,522.00|Cr",
    ].join("\n"),
  },
  "SBI: amount, marker, balance": {
    rows: 4,
    credits: 2,
    text: [
      "03/05/2026 SALARY CREDIT 44,800.00 Cr 86,762.00",
      "07/05/2026 EMI BAJAJ 8,500.00 Dr 78,262.00",
      "12/05/2026 UPI SWIGGY 640.00 Dr 77,622.00",
      "03/06/2026 SALARY CREDIT 44,900.00 Cr 122,522.00",
    ].join("\n"),
  },
  "Axis: withdrawal, deposit, balance": {
    rows: 4,
    credits: 2,
    text: [
      "03/05/2026 SALARY CREDIT      0.00   44,800.00   86,762.00",
      "07/05/2026 EMI BAJAJ      8,500.00        0.00   78,262.00",
      "12/05/2026 UPI SWIGGY       640.00        0.00   77,622.00",
      "03/06/2026 SALARY CREDIT      0.00   44,900.00  122,522.00",
    ].join("\n"),
  },
  "amount only, no balance column": {
    rows: 3,
    credits: 1,
    text: [
      "03/05/2026  SALARY CREDIT   44,800.00 Cr",
      "07/05/2026  EMI BAJAJ        8,500.00 Dr",
      "12/05/2026  UPI-SWIGGY         640.00 Dr",
    ].join("\n"),
  },
  "signed amounts, dash dates": {
    rows: 3,
    credits: 1,
    text: [
      "03-05-2026  SALARY CREDIT      44,800.00",
      "07-05-2026  EMI BAJAJ          -8,500.00",
      "12-05-2026  UPI SWIGGY           -640.00",
    ].join("\n"),
  },
  "ISO dates": {
    rows: 3,
    credits: 1,
    text: [
      "2026-05-03  SALARY CREDIT      44,800.00",
      "2026-05-07  EMI BAJAJ           8,500.00",
      "2026-05-12  UPI SWIGGY            640.00",
    ].join("\n"),
  },
  "month names": {
    rows: 3,
    credits: 1,
    text: [
      "03 May 2026  SALARY CREDIT   44,800.00 Cr",
      "07 May 2026  EMI BAJAJ        8,500.00 Dr",
      "12 May 2026  UPI-SWIGGY         640.00 Dr",
    ].join("\n"),
  },
};

describe("statement formats", () => {
  for (const [name, c] of Object.entries(CASES)) {
    it(`reads ${name}`, () => {
      const parsed = parseStatementText(c.text);
      expect(parsed.transactions).toHaveLength(c.rows);
      expect(parsed.transactions.filter((t) => t.type === "credit")).toHaveLength(c.credits);
      expect(parsed.confidence).toBeGreaterThan(0.9);
      // No column separators or markers should leak into the description.
      for (const t of parsed.transactions) {
        expect(t.description).not.toMatch(/\||\bCr\b|\bDr\b/);
      }
    });
  }

  it("produces the same decision from every layout of the same statement", () => {
    const decisions = ["HDFC: amount, balance, Cr/Dr suffix", "ICICI: pipe separated with trailing marker", "SBI: amount, marker, balance"].map(
      (name) => {
        const parsed = parseStatementText(CASES[name].text);
        return analyze({ transactions: parsed.transactions, period: "2 months" }).decision;
      },
    );
    expect(new Set(decisions).size).toBe(1);
  });

  it("is deterministic end to end", () => {
    const parsed = parseStatementText(CASES["HDFC: amount, balance, Cr/Dr suffix"].text);
    const a = analyze({ transactions: parsed.transactions, period: "2 months" });
    const b = analyze({ transactions: parsed.transactions, period: "2 months" });
    expect(a.decision).toBe(b.decision);
    expect(a.risk_score).toBe(b.risk_score);
  });
});

describe("bank detection", () => {
  it("does not mistake a lender mentioned in a row for the issuing bank", () => {
    const text = [
      "STATE BANK OF INDIA - STATEMENT OF ACCOUNT",
      "Account: XXXX1902    Period: 3 months",
      "03/04/2026 CASH DEP 12,000.00 Cr 12,000.00",
      "07/04/2026 EMI ICICI PERSONAL LOAN 15,000.00 Dr 0.00",
    ].join("\n");
    expect(parseStatementText(text).bank).toBe("STATE BANK");
  });

  it("falls back to the earliest mention when the title has no bank", () => {
    const text = [
      "Statement of account",
      "07/04/2026 EMI HDFC BANK 15,000.00 Dr 0.00",
      "08/04/2026 UPI SWIGGY 640.00 Dr 0.00",
    ].join("\n");
    expect(parseStatementText(text).bank).toBe("HDFC");
  });
});
