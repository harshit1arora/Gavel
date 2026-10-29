/**
 * Pure request validation for POST /v1/underwriting/analyze.
 *
 * The canonical input is structured transactions JSON only. PDFs must be
 * normalized via the /v1/parse pre-step first, a raw/non-JSON body is a 400
 * transport fault, never a decision. Exported standalone so it is unit-testable
 * without spinning up Express.
 */

import { AnalyzeInput } from '../types/underwriting';

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export interface ValidationError {
  code: string;
  message: string;
  detail?: string;
}

export interface ValidationResult {
  ok: boolean;
  error?: ValidationError;
  input?: AnalyzeInput;
}

export function validateAnalyzeRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {
      ok: false,
      error: {
        code: 'E400',
        message: 'Malformed request body',
        detail:
          'Expected a JSON object. If you have a PDF statement, parse it via POST /v1/parse/bank-statement first, then submit the returned transactions JSON.',
      },
    };
  }

  const b = body as Record<string, any>;

  const applicant = b.applicant;
  if (!applicant || typeof applicant !== 'object') {
    return {
      ok: false,
      error: { code: 'E400', message: 'Missing required field: applicant' },
    };
  }

  if (!applicant.name || typeof applicant.name !== 'string') {
    return {
      ok: false,
      error: { code: 'E400', message: 'Missing required field: applicant.name' },
    };
  }

  if (!applicant.pan || typeof applicant.pan !== 'string') {
    return {
      ok: false,
      error: { code: 'E400', message: 'Missing required field: applicant.pan' },
    };
  }

  if (!PAN_RE.test(String(applicant.pan).toUpperCase())) {
    return {
      ok: false,
      error: {
        code: 'E400',
        message: 'Invalid PAN format',
        detail: 'PAN must match 5 letters + 4 digits + 1 letter (e.g. ABCPK1234D).',
      },
    };
  }

  const statement = b.bank_statement;
  if (!statement || typeof statement !== 'object') {
    return {
      ok: false,
      error: {
        code: 'E400',
        message: 'Missing required field: bank_statement',
        detail:
          'Provide normalized transactions. Raw PDFs must go through POST /v1/parse/bank-statement first.',
      },
    };
  }

  const MAX_TRANSACTIONS = 20000;

  if (!Array.isArray(statement.transactions) || statement.transactions.length === 0) {
    return {
      ok: false,
      error: {
        code: 'E400',
        message: 'Missing or empty bank_statement.transactions[]',
        detail:
          'At least one transaction is required. Parse PDFs via POST /v1/parse/bank-statement to obtain this array.',
      },
    };
  }

  if (statement.transactions.length > MAX_TRANSACTIONS) {
    return {
      ok: false,
      error: {
        code: 'E413',
        message: 'Too many transactions',
        detail: `Received ${statement.transactions.length} transactions; the limit is ${MAX_TRANSACTIONS} per statement. Split the period or summarise the statement before submitting.`,
      },
    };
  }

  for (let i = 0; i < statement.transactions.length; i++) {
    const t = statement.transactions[i];
    if (!t || typeof t !== 'object' || t.amount === undefined || t.date === undefined) {
      return {
        ok: false,
        error: {
          code: 'E400',
          message: `Malformed transaction at index ${i}`,
          detail: 'Each transaction needs at least `date` and `amount`.',
        },
      };
    }
  }

  return { ok: true, input: body as AnalyzeInput };
}
