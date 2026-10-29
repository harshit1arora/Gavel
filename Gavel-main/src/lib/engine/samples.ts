import type { Txn } from "./types";

/**
 * Synthetic, but structurally real, bank statements.
 *
 * Every applicant below is generated as transactions and then run through the
 * same engine as an uploaded PDF. The verdicts are never hardcoded: they fall
 * out of the numbers.
 */

export interface SampleApplicant {
  id: string;
  name: string;
  pan: string;
  employer: string;
  loanAmount: number;
  purpose: string;
  transactions: Txn[];
  months: number;
}

interface Profile {
  id: string;
  name: string;
  pan: string;
  employer: string;
  salary: number;
  salaryRegularity: number; // 0..1, share of months with a salary credit
  salaryVariance: number; // ± fraction
  existingEmis: { label: string; amount: number }[];
  spendPerMonth: number;
  bounceMonths: number[]; // 1-indexed months with a failed debit / negative balance
  months: number;
  loanAmount: number;
  purpose: string;
}

const PROFILES: Profile[] = [
  {
    id: "apl-1024",
    name: "Rajesh Kumar",
    pan: "ABCPK1234D",
    employer: "Infosys Ltd",
    salary: 44800,
    salaryRegularity: 1,
    salaryVariance: 0.01,
    existingEmis: [{ label: "EMI BAJAJ FINANCE", amount: 8500 }],
    spendPerMonth: 14500,
    bounceMonths: [],
    months: 6,
    loanAmount: 200000,
    purpose: "Business expansion",
  },
  {
    id: "apl-1025",
    name: "Priya Sharma",
    pan: "XYZPS5678K",
    employer: "Self employed, retail",
    salary: 38000,
    salaryRegularity: 0.4,
    salaryVariance: 0.35,
    existingEmis: [
      { label: "EMI HDFC BANK", amount: 15000 },
      { label: "EMI ICICI PERSONAL LOAN", amount: 8200 },
      { label: "EMI TATA CAPITAL", amount: 6100 },
    ],
    spendPerMonth: 21000,
    bounceMonths: [2, 5],
    months: 6,
    loanAmount: 500000,
    purpose: "Working capital",
  },
  {
    id: "apl-1026",
    name: "Amit Verma",
    pan: "QWEAV9012L",
    employer: "Verma Traders (proprietor)",
    salary: 31000,
    salaryRegularity: 0.7,
    salaryVariance: 0.18,
    existingEmis: [{ label: "EMI FULLERTON INDIA", amount: 7400 }],
    spendPerMonth: 19800,
    bounceMonths: [],
    months: 6,
    loanAmount: 250000,
    purpose: "Equipment purchase",
  },
  {
    id: "apl-1027",
    name: "Sneha Iyer",
    pan: "LMNSI3344P",
    employer: "Deloitte India",
    salary: 92000,
    salaryRegularity: 1,
    salaryVariance: 0.005,
    existingEmis: [{ label: "EMI HDFC HOME LOAN", amount: 24500 }],
    spendPerMonth: 28000,
    bounceMonths: [],
    months: 6,
    loanAmount: 800000,
    purpose: "Home renovation",
  },
  {
    id: "apl-1028",
    name: "Imran Qureshi",
    pan: "MNOPQ7788R",
    employer: "Qureshi Logistics",
    salary: 26000,
    salaryRegularity: 0.5,
    salaryVariance: 0.42,
    existingEmis: [{ label: "EMI BAJAJ TWO WHEELER", amount: 3800 }],
    spendPerMonth: 23000,
    bounceMonths: [3],
    months: 4,
    loanAmount: 150000,
    purpose: "Vehicle repair",
  },
  {
    id: "apl-1029",
    name: "Kavya Reddy",
    pan: "RSTUV2211W",
    employer: "Reddy Diagnostics",
    salary: 54000,
    salaryRegularity: 0.9,
    salaryVariance: 0.08,
    existingEmis: [{ label: "EMI KOTAK CAR LOAN", amount: 12800 }],
    spendPerMonth: 31000,
    bounceMonths: [],
    months: 6,
    loanAmount: 400000,
    purpose: "Clinic expansion",
  },
];

function monthStart(offset: number): Date {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
  return d;
}

function iso(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** Deterministic pseudo-random so the same applicant always yields the same numbers. */
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function buildTransactions(p: Profile): Txn[] {
  const rand = seeded(p.id.split("").reduce((a, c) => a + c.charCodeAt(0), 7));
  const txns: Txn[] = [];
  let balance = 42000;

  for (let m = p.months; m >= 1; m--) {
    const start = monthStart(m);
    const monthIndex = p.months - m + 1;
    const hasSalary = rand() < p.salaryRegularity;
    const day = (n: number) => iso(new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), n)));

    if (hasSalary) {
      const salary = Math.round(p.salary * (1 + (rand() - 0.5) * p.salaryVariance));
      balance += salary;
      txns.push({
        date: day(3),
        description: `SALARY CREDIT - ${p.employer.toUpperCase()}`,
        amount: salary,
        type: "credit",
        balance,
      });
    } else {
      const inflow = Math.round(p.salary * (0.35 + rand() * 0.4));
      balance += inflow;
      txns.push({
        date: day(7),
        description: "IMPS INWARD - PART PAYMENT RECEIVED",
        amount: inflow,
        type: "credit",
        balance,
      });
    }

    for (const emi of p.existingEmis) {
      balance -= emi.amount;
      txns.push({ date: day(7), description: emi.label, amount: emi.amount, type: "debit", balance });
    }

    const spend = Math.round((p.spendPerMonth / 4) * (0.8 + rand() * 0.4));
    const spendLabels = ["UPI - SWIGGY", "UPI - BIGBASKET", "POS - RELIANCE FRESH", "UPI - AMAZON PAY"];
    for (let i = 0; i < 4; i++) {
      balance -= spend;
      txns.push({
        date: day(9 + i * 4),
        description: spendLabels[i % spendLabels.length],
        amount: spend,
        type: "debit",
        balance,
      });
    }

    if (p.bounceMonths.includes(monthIndex)) {
      const bounce = 1500;
      balance -= bounce;
      txns.push({
        date: day(21),
        description: "RETURN - INSUFFICIENT FUNDS (BOUNCE CHARGES)",
        amount: bounce,
        type: "debit",
        balance,
      });
      // A bounce month means the balance dipped below zero for a while.
      txns.push({
        date: day(22),
        description: "OD CHARGES - OVERDRAWN ACCOUNT",
        amount: 350,
        type: "debit",
        balance: -bounce,
      });
      balance = 12000;
    }
  }

  return txns.sort((a, b) => a.date.localeCompare(b.date));
}

export const SAMPLE_APPLICANTS: SampleApplicant[] = PROFILES.map((p) => ({
  id: p.id,
  name: p.name,
  pan: p.pan,
  employer: p.employer,
  loanAmount: p.loanAmount,
  purpose: p.purpose,
  months: p.months,
  transactions: buildTransactions(p),
}));

/** A statement shaped like a real PDF's text layer, for the "sample" button. */
export function sampleStatementText(applicant: SampleApplicant): string {
  const lines = [
    `${applicant.employer.toUpperCase()}: STATEMENT OF ACCOUNT`,
    `Account: XXXX${applicant.pan.slice(-4)} Period: ${applicant.months} months`,
    "Date Particulars Amount Balance",
    "-".repeat(78),
  ];
  for (const t of applicant.transactions) {
    const d = t.date.split("-");
    const date = `${d[2]}/${d[1]}/${d[0]}`;
    const desc = t.description.slice(0, 38).padEnd(38, " ");
    const amt = t.amount.toFixed(2).padStart(12, " ");
    const bal = (t.balance ?? 0).toFixed(2).padStart(12, " ");
    lines.push(`${date} ${desc} ${amt} ${bal} ${t.type === "credit" ? "Cr": "Dr"}`);
  }
  return lines.join("\n");
}
