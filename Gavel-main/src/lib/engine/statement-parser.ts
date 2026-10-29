import type { Txn } from "./types";

/**
 * Bank statement text to transactions.
 *
 * Runs entirely in the browser: the PDF never leaves the machine.
 *
 * Indian statements vary a lot, so the parser is explicit about what it can
 * read. It handles:
 *   - dates: DD/MM/YYYY, DD-MM-YY, DD.MM.YYYY, DD Mon YYYY, YYYY-MM-DD
 *   - layouts: amount + balance, amount only, withdrawal/deposit/balance columns,
 *     pipe or tab separated columns
 *   - direction: Cr/Dr markers, signed amounts, or movement of the running
 *     balance when the statement gives neither
 *
 * Anything it cannot read with confidence is reported through `confidence` and
 * `warnings` rather than guessed silently.
 */

export interface ParsedStatement {
  transactions: Txn[];
  bank?: string;
  period?: string;
  confidence: number;
  lines_scanned: number;
  warnings: string[];
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

const BANKS = [
  "HDFC", "ICICI", "SBI", "STATE BANK", "AXIS", "KOTAK", "IDFC", "YES BANK",
  "INDUSIND", "BANK OF BARODA", "PNB", "PUNJAB NATIONAL", "CANARA", "UNION BANK",
  "FEDERAL BANK", "RBL", "BANDHAN", "AU SMALL FINANCE", "IDBI",
];

const CREDIT_HINTS = /salary|payroll|stipend|refund|reversal|cash dep|deposit|credit|neft cr|imps cr|interest|dividend/i;

/** Money with two decimals, optional thousands separators and sign. */
const MONEY = /-?(?:\d{1,3}(?:,\d{2,3})+|\d+)\.\d{2}\b/g;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export interface DateMatch {
  iso: string;
  /** Number of characters consumed from the start of the line. */
  length: number;
}

/** Parse a leading date and report how much of the line it used. */
export function matchDate(raw: string): DateMatch | null {
  const s = raw.trimStart();
  const offset = raw.length - s.length;

  // 01/04/2024, 01-04-2024, 01.04.2024, 1/4/24
  let m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/.exec(s);
  if (m) {
    const [, d, mo, y] = m;
    let day = parseInt(d, 10);
    let month = parseInt(mo, 10);
    let year = parseInt(y, 10);
    if (year < 100) year += year > 70 ? 1900 : 2000;
    if (month > 12 && day <= 12) [day, month] = [month, day];
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return { iso: `${year}-${pad(month)}-${pad(day)}`, length: offset + m[0].length };
  }

  // 2024-04-01
  m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return { iso: `${m[1]}-${m[2]}-${m[3]}`, length: offset + m[0].length };

  // 01 Apr 2024, 01-Apr-2024, 1 April 24
  m = /^(\d{1,2})[\s-]([A-Za-z]{3,9})[\s-](\d{2,4})/.exec(s);
  if (m) {
    const key = m[2].toLowerCase();
    const month = MONTHS[key.slice(0, 4)] ?? MONTHS[key.slice(0, 3)];
    if (!month) return null;
    let year = parseInt(m[3], 10);
    if (year < 100) year += year > 70 ? 1900 : 2000;
    return { iso: `${year}-${pad(month)}-${pad(parseInt(m[1], 10))}`, length: offset + m[0].length };
  }

  return null;
}

/** Backwards compatible helper: ISO date for a string that starts with one. */
export function parseDate(raw: string): string | null {
  return matchDate(raw)?.iso ?? null;
}

function cleanDescription(raw: string): string {
  return raw
    .replace(MONEY, " ")
    .replace(/\|/g, " ")
    .replace(/\b(cr|dr|credit|debit)\b\.?/gi, " ")
    .replace(/[:-]\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s:\-|]+/, "")
    .trim()
    .slice(0, 80);
}

type Direction = "credit" | "debit";

/**
 * Work out which money column is the amount, which is the balance, and which
 * way the money moved.
 *
 * Column order is not standardised across Indian banks:
 *   HDFC   : amount, balance
 *   Axis   : withdrawal, deposit, balance
 *   ICICI  : amount, balance, Cr/Dr
 *   Some   : amount only
 */
function readAmounts(
  amounts: number[],
  marker: Direction | undefined,
  description: string,
): { amount: number; balance?: number; direction: Direction } | null {
  if (amounts.length === 0) return null;

  // Three or more columns: withdrawal | deposit | balance
  if (amounts.length >= 3) {
    const balance = amounts[amounts.length - 1];
    const withdrawal = amounts[amounts.length - 3];
    const deposit = amounts[amounts.length - 2];

    if (withdrawal === 0 && deposit !== 0) {
      return { amount: Math.abs(deposit), balance, direction: marker ?? "credit" };
    }
    if (deposit === 0 && withdrawal !== 0) {
      return { amount: Math.abs(withdrawal), balance, direction: marker ?? "debit" };
    }
    // Both columns populated (rare) or a stray extra column: use the last
    // non-zero value before the balance.
    const candidate = deposit !== 0 ? deposit : withdrawal;
    if (candidate === 0) return null;
    return {
      amount: Math.abs(candidate),
      balance,
      direction: marker ?? (candidate < 0 ? "debit" : CREDIT_HINTS.test(description) ? "credit" : "debit"),
    };
  }

  // Two columns: amount, balance
  if (amounts.length === 2) {
    const [amount, balance] = amounts;
    if (amount === 0) return null;
    return {
      amount: Math.abs(amount),
      balance,
      direction: marker ?? (amount < 0 ? "debit" : CREDIT_HINTS.test(description) ? "credit" : "debit"),
    };
  }

  // One column: amount only
  const only = amounts[0];
  if (only === 0) return null;
  return {
    amount: Math.abs(only),
    direction: marker ?? (only < 0 ? "debit" : CREDIT_HINTS.test(description) ? "credit" : "debit"),
  };
}

export function parseStatementText(text: string): ParsedStatement {
  const lines = text.split(/\r?\n/);
  const warnings: string[] = [];
  const txns: Txn[] = [];
  let scanned = 0;
  let candidates = 0;
  let previousBalance: number | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    scanned++;

    const dateMatch = matchDate(line);
    if (!dateMatch) continue;

    const rest = line.slice(dateMatch.length).trim();
    MONEY.lastIndex = 0;
    const amounts: number[] = [];
    let money: RegExpExecArray | null;
    while ((money = MONEY.exec(rest)) !== null) {
      amounts.push(parseFloat(money[0].replace(/,/g, "")));
    }
    if (amounts.length === 0) continue;
    candidates++;

    // Cr/Dr markers can sit at the end of the line or right after the amount.
    const tail = rest.slice(-12);
    let marker: Direction | undefined;
    if (/\bcr\b|\bcredit\b/i.test(tail)) marker = "credit";
    else if (/\bdr\b|\bdebit\b/i.test(tail)) marker = "debit";

    const description = cleanDescription(rest);
    const read = readAmounts(amounts, marker, description);
    if (!read) continue;

    let direction = read.direction;
    // No marker and no sign: fall back to the movement of the running balance.
    if (!marker && read.balance !== undefined && previousBalance !== null) {
      if (read.balance > previousBalance) direction = "credit";
      else if (read.balance < previousBalance) direction = "debit";
    }

    txns.push({
      date: dateMatch.iso,
      description: description || "Transaction",
      amount: Math.round(read.amount * 100) / 100,
      type: direction,
      balance: read.balance,
    });
    if (read.balance !== undefined) previousBalance = read.balance;
  }

  const seen = new Set<string>();
  const unique = txns.filter((t) => {
    const key = `${t.date}|${t.amount}|${t.type}|${t.description}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  unique.sort((a, b) => a.date.localeCompare(b.date));

  // The bank name lives in the title block. Only look at the first few lines
  // first, otherwise a row like "EMI ICICI PERSONAL LOAN" makes an SBI
  // statement look like an ICICI one. Fall back to whichever name appears
  // earliest in the document.
  const title = lines.slice(0, 3).join(" ");
  let bank = BANKS.find((b) => new RegExp(b, "i").test(title));
  if (!bank) {
    let earliest = Number.POSITIVE_INFINITY;
    for (const candidate of BANKS) {
      const index = text.search(new RegExp(candidate, "i"));
      if (index >= 0 && index < earliest) {
        earliest = index;
        bank = candidate;
      }
    }
  }

  let period: string | undefined;
  if (unique.length > 1) {
    const first = unique[0].date;
    const last = unique[unique.length - 1].date;
    const months =
      (new Date(last).getFullYear() - new Date(first).getFullYear()) * 12 +
      (new Date(last).getMonth() - new Date(first).getMonth()) +
      1;
    if (months > 0) period = `${months} months`;
  }

  const confidence = candidates === 0 ? 0 : Math.min(0.99, unique.length / Math.max(candidates, 1));

  if (unique.length === 0) {
    warnings.push(
      "No transactions could be read from this PDF. It may be a scanned image (no text layer) or a format we do not recognise yet.",
    );
  } else if (unique.length < 5) {
    warnings.push("Only a few transactions detected, check that the full statement period was uploaded.");
  }

  return { transactions: unique, bank, period, confidence, lines_scanned: scanned, warnings };
}
