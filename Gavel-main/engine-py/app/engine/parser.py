"""Bank statement text to transactions.

Mirrors `src/lib/engine/statement-parser.ts` so the browser and the FastAPI
service read the same statement the same way. A parity test keeps them honest.
"""

from __future__ import annotations

import re
from typing import Optional

from ..schemas import ParsedStatement, Txn

MONTHS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "sept": 9, "oct": 10, "nov": 11, "dec": 12,
}

BANKS = [
    "HDFC", "ICICI", "SBI", "STATE BANK", "AXIS", "KOTAK", "IDFC", "YES BANK",
    "INDUSIND", "BANK OF BARODA", "PNB", "PUNJAB NATIONAL", "CANARA", "UNION BANK",
    "FEDERAL BANK", "RBL", "BANDHAN", "AU SMALL FINANCE", "IDBI",
]

CREDIT_HINTS = re.compile(
    r"salary|payroll|stipend|refund|reversal|cash dep|deposit|credit|neft cr|imps cr|interest|dividend",
    re.I,
)
MONEY = re.compile(r"-?(?:\d{1,3}(?:,\d{2,3})+|\d+)\.\d{2}\b")

DATE_DMY = re.compile(r"^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})")
DATE_ISO = re.compile(r"^(\d{4})-(\d{2})-(\d{2})")
DATE_MONTH = re.compile(r"^(\d{1,2})[\s-]([A-Za-z]{3,9})[\s-](\d{2,4})")


def match_date(raw: str) -> Optional[tuple[str, int]]:
    """Return (iso_date, characters_consumed) for a leading date."""
    s = raw.lstrip()
    offset = len(raw) - len(s)

    m = DATE_DMY.match(s)
    if m:
        day, month, year = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if year < 100:
            year += 1900 if year > 70 else 2000
        if month > 12 and day <= 12:
            day, month = month, day
        if not (1 <= month <= 12 and 1 <= day <= 31):
            return None
        return f"{year:04d}-{month:02d}-{day:02d}", offset + len(m.group(0))

    m = DATE_ISO.match(s)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}", offset + len(m.group(0))

    m = DATE_MONTH.match(s)
    if m:
        key = m.group(2).lower()
        month = MONTHS.get(key[:4]) or MONTHS.get(key[:3])
        if not month:
            return None
        year = int(m.group(3))
        if year < 100:
            year += 1900 if year > 70 else 2000
        return f"{year:04d}-{month:02d}-{int(m.group(1)):02d}", offset + len(m.group(0))

    return None


def parse_date(raw: str) -> Optional[str]:
    matched = match_date(raw)
    return matched[0] if matched else None


def clean_description(raw: str) -> str:
    text = MONEY.sub(" ", raw)
    text = text.replace("|", " ")
    text = re.sub(r"\b(cr|dr|credit|debit)\b\.?", " ", text, flags=re.I)
    text = re.sub(r"[:\-]\s*$", "", text)
    text = re.sub(r"\s{2,}", " ", text)
    text = re.sub(r"^[\s:\-|]+", "", text)
    return text.strip()[:80]


def read_amounts(amounts: list[float], marker: Optional[str], description: str):
    """Pick the amount column, the balance column and the direction."""
    if not amounts:
        return None

    if len(amounts) >= 3:
        balance = amounts[-1]
        withdrawal = amounts[-3]
        deposit = amounts[-2]
        if withdrawal == 0 and deposit != 0:
            return abs(deposit), balance, marker or "credit"
        if deposit == 0 and withdrawal != 0:
            return abs(withdrawal), balance, marker or "debit"
        candidate = deposit if deposit != 0 else withdrawal
        if candidate == 0:
            return None
        direction = marker or ("debit" if candidate < 0 else ("credit" if CREDIT_HINTS.search(description) else "debit"))
        return abs(candidate), balance, direction

    if len(amounts) == 2:
        amount, balance = amounts
        if amount == 0:
            return None
        direction = marker or ("debit" if amount < 0 else ("credit" if CREDIT_HINTS.search(description) else "debit"))
        return abs(amount), balance, direction

    only = amounts[0]
    if only == 0:
        return None
    direction = marker or ("debit" if only < 0 else ("credit" if CREDIT_HINTS.search(description) else "debit"))
    return abs(only), None, direction


def parse_statement_text(text: str) -> ParsedStatement:
    txns: list[Txn] = []
    warnings: list[str] = []
    scanned = 0
    candidates = 0
    previous_balance: Optional[float] = None

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        scanned += 1

        matched = match_date(line)
        if not matched:
            continue
        iso, consumed = matched
        rest = line[consumed:].strip()

        amounts = [float(a.replace(",", "")) for a in MONEY.findall(rest)]
        if not amounts:
            continue
        candidates += 1

        tail = rest[-12:]
        marker = None
        if re.search(r"\bcr\b|\bcredit\b", tail, re.I):
            marker = "credit"
        elif re.search(r"\bdr\b|\bdebit\b", tail, re.I):
            marker = "debit"

        description = clean_description(rest)
        read = read_amounts(amounts, marker, description)
        if read is None:
            continue
        amount, balance, direction = read

        if marker is None and balance is not None and previous_balance is not None:
            if balance > previous_balance:
                direction = "credit"
            elif balance < previous_balance:
                direction = "debit"

        txns.append(
            Txn(
                date=iso,
                description=description or "Transaction",
                amount=round(amount, 2),
                type=direction,  # type: ignore[arg-type]
                balance=balance,
            )
        )
        if balance is not None:
            previous_balance = balance

    seen: set[tuple] = set()
    unique: list[Txn] = []
    for t in txns:
        key = (t.date, t.amount, t.type, t.description)
        if key in seen:
            continue
        seen.add(key)
        unique.append(t)
    unique.sort(key=lambda t: t.date)

    title = " ".join(text.splitlines()[:3])
    bank = next((b for b in BANKS if re.search(b, title, re.I)), None)
    if bank is None:
        earliest = len(text) + 1
        for candidate in BANKS:
            found = re.search(candidate, text, re.I)
            if found and found.start() < earliest:
                earliest = found.start()
                bank = candidate

    period = None
    if len(unique) > 1:
        first, last = unique[0].date, unique[-1].date
        months = (int(last[:4]) - int(first[:4])) * 12 + (int(last[5:7]) - int(first[5:7])) + 1
        if months > 0:
            period = f"{months} months"

    confidence = 0.0 if candidates == 0 else min(0.99, len(unique) / max(candidates, 1))

    if not unique:
        warnings.append(
            "No transactions could be read from this text. It may be a scanned image "
            "(no text layer) or a format we do not recognise yet."
        )
    elif len(unique) < 5:
        warnings.append("Only a few transactions detected, check that the full statement period was supplied.")

    return ParsedStatement(
        transactions=unique,
        bank=bank,
        period=period,
        confidence=round(confidence, 4),
        lines_scanned=scanned,
        warnings=warnings,
    )
