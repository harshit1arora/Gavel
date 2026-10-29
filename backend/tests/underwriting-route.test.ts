import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { AddressInfo } from 'net';

/**
 * Route-level tests for POST /v1/underwriting/analyze using a tiny in-memory
 * Firestore stand-in. Verifies the HTTP status contract (Decision 10) and the
 * idempotency / single-charge guarantee (Decision 11) end-to-end through the
 * real router, validator, quota middleware and engine.
 */

// ── In-memory Firestore mock ────────────────────────────────────────────
const store = new Map<string, any>();
let autoId = 0;
const addCounts: Record<string, number> = {};

function docRef(collection: string, id: string) {
  const path = `${collection}/${id}`;
  return {
    async get() {
      const data = store.get(path);
      return { exists: data !== undefined, data: () => data };
    },
    async set(data: any) {
      store.set(path, data);
    },
    async update(data: any) {
      store.set(path, {...(store.get(path) || {}),...data });
    },
    _path: path,
  };
}

const fakeDb = {
  collection(name: string) {
    return {
      doc(id: string) {
        return docRef(name, id);
      },
      async add(data: any) {
        addCounts[name] = (addCounts[name] || 0) + 1;
        const id = `auto_${autoId++}`;
        store.set(`${name}/${id}`, data);
        return { id };
      },
    };
  },
  async runTransaction(fn: (t: any) => Promise<void>) {
    const tx = {
      async get(ref: any) {
        return ref.get();
      },
      set(ref: any, data: any) {
        store.set(ref._path, data);
      },
      update(ref: any, data: any) {
        store.set(ref._path, {...(store.get(ref._path) || {}),...data });
      },
    };
    return fn(tx);
  },
};

vi.mock('../src/config/firebase', () => ({ db: fakeDb, admin: {} }));

let server: any;
let baseUrl: string;
let underwritingRouter: any;

const STRONG_BODY = {
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
};

const THIN_BODY = {
  applicant: { name: 'Karan Mehta', pan: 'ABCKM7890Z' },
  bank_statement: {
    period: '1 month',
    transactions: [{ date: '2024-01-02', description: 'SALARY CREDIT', amount: 40000, type: 'credit', balance: 41000 }],
  },
};

beforeAll(async () => {
  const express = (await import('express')).default;
  underwritingRouter = (await import('../src/routes/underwriting')).default;

  const app = express();
  app.use(express.json());
  // Stand in for authenticateAnyToken, a valid, authenticated org. The org can
  // be overridden per request via x-test-org to exercise cross-org isolation.
  app.use((req: any, _res, next) => {
    req.orgId = req.headers['x-test-org'] || 'org_test';
    req.apiKeyId = 'key_test';
    next();
  });
  app.use('/v1/underwriting', underwritingRouter);

  server = app.listen(0);
  await new Promise<void>(r => server.on('listening', r));
  const port = (server.address() as AddressInfo).port;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(() => {
  server?.close();
});

function post(body: any, headers: Record<string, string> = {}) {
  return fetch(`${baseUrl}/v1/underwriting/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json',...headers },
    body: typeof body === 'string' ? body: JSON.stringify(body),
  });
}

describe('POST /v1/underwriting/analyze, status contract', () => {
  it('returns 200 with an APPROVE decision for a strong file', async () => {
    const res = await post(STRONG_BODY);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.decision).toBe('APPROVE');
    expect(json.audit_id).toMatch(/^gavel_/);
  });

  it('returns 200 (not an HTTP error) for an E001 thin-file reject', async () => {
    const res = await post(THIN_BODY);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.decision).toBe('REJECT');
    expect(json.error.code).toBe('E001');
  });

  it('returns 400 for a malformed payload (bad PAN)', async () => {
    const res = await post({...STRONG_BODY, applicant: {...STRONG_BODY.applicant, pan: 'NOPE' } });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.message).toMatch(/PAN/);
  });

  it('returns 400 for a raw PDF posted to /analyze', async () => {
    const res = await fetch(`${baseUrl}/v1/underwriting/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/pdf' },
      body: '%PDF-1.7 binary…',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /v1/underwriting/analyze, idempotency (Decision 11)', () => {
  const countAuditRows = () =>
    [...store.keys()].filter(k => k.startsWith('audit_logs/')).length;

  it('a retried Idempotency-Key replays the result with no new audit row or charge', async () => {
    const auditBefore = countAuditRows();
    const usageRef = await fakeDb.collection('usage_stats').doc('org_test').get();
    const callsBefore = (usageRef.data()?.apiCalls as number) || 0;

    const first = await post(STRONG_BODY, { 'Idempotency-Key': 'retry-key-1' });
    const firstJson = await first.json();

    const second = await post(STRONG_BODY, { 'Idempotency-Key': 'retry-key-1' });
    const secondJson = await second.json();
    expect(second.headers.get('Idempotent-Replay')).toBe('true');

    // Identical decision + same audit_id on replay.
    expect(secondJson.audit_id).toBe(firstJson.audit_id);
    expect(secondJson.decision).toBe(firstJson.decision);

    // Exactly one audit row and one quota increment across both calls.
    const auditAfter = countAuditRows();
    const callsAfter =
      ((await fakeDb.collection('usage_stats').doc('org_test').get()).data()?.apiCalls as number) || 0;
    expect(auditAfter - auditBefore).toBe(1);
    expect(callsAfter - callsBefore).toBe(1);
  });
});

describe('GET /v1/underwriting/audit/:audit_id/pdf, leave-behind', () => {
  it('streams the audit PDF for an existing decision', async () => {
    const created = await (await post(STRONG_BODY)).json();
    const auditId = created.audit_id;

    const res = await fetch(`${baseUrl}/v1/underwriting/audit/${auditId}/pdf`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/pdf');
    expect(res.headers.get('content-disposition')).toContain(`gavel-audit-${auditId}.pdf`);

    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.slice(0, 5).toString('latin1')).toBe('%PDF-');
    expect(buf.includes(Buffer.from(auditId))).toBe(true);
    // Full ledger present, raw PAN absent.
    expect(buf.includes(Buffer.from('R024'))).toBe(true);
    expect(buf.includes(Buffer.from('ABCPK1234D'))).toBe(false);
  });

  it('returns 404 for an unknown audit_id', async () => {
    const res = await fetch(`${baseUrl}/v1/underwriting/audit/gavel_does_not_exist/pdf`);
    expect(res.status).toBe(404);
  });

  it("does not serve another org's audit record (404, no existence leak)", async () => {
    const created = await (await post(STRONG_BODY)).json();
    const auditId = created.audit_id;

    const res = await fetch(`${baseUrl}/v1/underwriting/audit/${auditId}/pdf`, {
      headers: { 'x-test-org': 'org_attacker' },
    });
    expect(res.status).toBe(404);
    const ct = res.headers.get('content-type') || '';
    expect(ct).not.toContain('application/pdf');
  });
});
