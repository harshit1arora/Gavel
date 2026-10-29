import crypto from 'crypto';
import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { enforceQuota } from '../middleware/quota';
import { db } from '../config/firebase';
import { analyze } from '../services/underwriting-engine';
import { validateAnalyzeRequest } from '../services/underwriting-validator';
import { loadPilotPolicy } from '../config/policy-loader';
import { renderAuditPdf, AuditPdfRecord } from '../services/audit-pdf';
import { AnalysisResult } from '../types/underwriting';

const router = Router();

const IDEMPOTENCY_COLLECTION = 'underwriting_idempotency';
const AUDIT_COLLECTION = 'audit_logs';

/** Stable hash of a request body, used to bind an Idempotency-Key to its payload. */
const hashRequestBody = (body: unknown): string =>
  crypto.createHash('sha256').update(JSON.stringify(body ?? {})).digest('hex').slice(0, 32);

const idKeyDoc = (orgId: string, key: string) =>
  `${orgId}__${key}`.replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 256);

/**
 * Idempotency replay (runs BEFORE enforceQuota so a retry is never re-billed).
 * On a hit we return the stored result verbatim, no new audit row, no charge.
 */
const idempotencyReplay = async (
  req: AuthenticatedRequest,
  res: Response,
  next: () => void,
) => {
  const key = req.header('Idempotency-Key');
  if (!key) return next();
  try {
    const orgId = req.orgId!;
    const snap = await db.collection(IDEMPOTENCY_COLLECTION).doc(idKeyDoc(orgId, key)).get();
    if (snap.exists) {
      const stored = snap.data() as { result?: AnalysisResult; requestHash?: string };
      if (stored?.result) {
        // The same key with a different body is a client bug, not a retry.
        // Replaying the old result here would silently answer the wrong
        // question (Stripe's behaviour: 409 on key reuse with a new payload).
        const requestHash = hashRequestBody(req.body);
        if (stored.requestHash && requestHash && stored.requestHash !== requestHash) {
          return res.status(409).json({
            error: 'Idempotency-Key was reused with a different request body',
            code: 'IDEMPOTENCY_KEY_REUSED',
          });
        }
        res.setHeader('Idempotent-Replay', 'true');
        return res.status(200).json(stored.result);
      }
    }
    next();
  } catch (err) {
    console.error('Idempotency lookup error:', err);
    // Fail-open to evaluation rather than blocking a real request.
    next();
  }
};

/**
 * @openapi
 * /underwriting/analyze:
 * post:
 * summary: Underwrite a loan application from bank-statement transactions
 * description: >
 * Runs the tuned, deterministic policy engine over normalized transaction
 * JSON and returns APPROVE / REJECT / REVIEW with a credit limit, risk
 * score, weighted reasons and the full per-rule ledger. Any completed
 * analysis returns 200, including a data-insufficiency (E001) reject.
 * Send an `Idempotency-Key` header to make retries safe (deduped per org).
 * tags: [Underwriting]
 * parameters:
 * - in: header
 * name: Idempotency-Key
 * schema: { type: string }
 * required: false
 * responses:
 * 200: { description: Analysis completed (APPROVE / REVIEW / REJECT) }
 * 400: { description: Malformed payload / bad PAN / non-JSON body }
 * 401: { description: Missing or invalid API key }
 * 429: { description: Quota exceeded }
 */
router.post(
  '/analyze',
  idempotencyReplay,
  enforceQuota,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const orgId = req.orgId!;

      // Non-JSON bodies (e.g. a raw PDF upload) → transport fault, not a decision.
      if (!req.is('application/json')) {
        return res.status(400).json({
          error: {
            code: 'E400',
            message: 'Unsupported content type, application/json required',
            detail:
              'PDFs must be normalized via POST /v1/parse/bank-statement first; submit the returned transactions JSON here.',
          },
        });
      }

      const validation = validateAnalyzeRequest(req.body);
      if (!validation.ok || !validation.input) {
        return res.status(400).json({ error: validation.error });
      }

      const { policy, hash } = loadPilotPolicy();
      const { result, signals } = analyze(validation.input, policy);

      // ── Immutable audit row (RBI defensibility / exact replay) ─────────
      // Keyed by audit_id so the leave-behind PDF is a direct, org-scoped
      // lookup. Stores the full result + request context so the PDF can be
      // re-rendered identically from the record alone.
      const idemKey = req.header('Idempotency-Key') || null;
      const pan = String(validation.input.applicant.pan).toUpperCase();
      const panMasked = '******' + pan.slice(-4);
      await db.collection(AUDIT_COLLECTION).doc(result.audit_id).set({
        orgId,
        action: 'UNDERWRITING_ANALYZED',
        audit_id: result.audit_id,
        targetId: result.audit_id,
        detail: `Decision: ${result.decision}, Score: ${result.risk_score}, Limit: ${result.credit_limit}`,
        actor: 'underwriting_engine',
        timestamp: new Date(),
        result,
        signals,
        request: {
          applicant_name: validation.input.applicant.name,
          panMasked,
          bank: validation.input.bank_statement.bank || null,
          period: validation.input.bank_statement.period || null,
          loan_request: validation.input.loan_request || null,
        },
        rbiComplianceFields: {
          audit_id: result.audit_id,
          decision: result.decision,
          risk_score: result.risk_score,
          credit_limit: result.credit_limit,
          rules_fired: result.rules_fired,
          signals,
          panMasked,
          reviewerId: req.apiKeyId || req.uid || 'system',
          policyId: policy.policy_id,
          policyVersion: policy.version,
          policyHash: hash,
          idempotencyKey: idemKey,
        },
      });

      // ── Settle the idempotency key so retries replay this exact result ──
      if (idemKey) {
        await db
.collection(IDEMPOTENCY_COLLECTION)
.doc(idKeyDoc(orgId, idemKey))
.set({
            orgId,
            audit_id: result.audit_id,
            result,
            requestHash: hashRequestBody(req.body),
            createdAt: new Date(),
          });
      }

      return res.status(200).json(result);
    } catch (err) {
      console.error('Underwriting analyze error:', err);
      return res.status(500).json({
        error: { code: 'E500', message: 'Internal error during underwriting analysis' },
      });
    }
  },
);

/**
 * @openapi
 * /underwriting/audit/{audit_id}/pdf:
 * get:
 * summary: Download the tamper-evident audit PDF for a past decision
 * description: >
 * Streams a one-page, regulator-ready PDF rendered from the immutable
 * audit record, decision, score, limit, weighted reasons, the full rule
 * ledger, derived signals and a tamper-evident footer (audit_id, policy
 * version, config hash). Org-scoped: a record belonging to another org is
 * indistinguishable from one that does not exist (404, no existence leak).
 * tags: [Underwriting]
 * parameters:
 * - in: path
 * name: audit_id
 * required: true
 * schema: { type: string }
 * responses:
 * 200: { description: PDF stream (application/pdf) }
 * 404: { description: Audit record not found (or not owned by this org) }
 * 401: { description: Missing or invalid API key }
 */
router.get('/audit/:audit_id/pdf', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    const auditId = req.params.audit_id;

    const snap = await db.collection(AUDIT_COLLECTION).doc(auditId).get();
    const data = snap.exists ? (snap.data() as any): null;

    // 404 for both "missing" and "wrong org", never reveal that an audit_id
    // exists under a different tenant.
    if (!data || data.orgId !== orgId) {
      return res.status(404).json({
        error: { code: 'E404', message: 'Audit record not found' },
      });
    }

    const result = data.result as AnalysisResult;
    const rbi = data.rbiComplianceFields || {};
    const request = data.request || {};
    const ts =
      data.timestamp && typeof data.timestamp.toDate === 'function'
        ? data.timestamp.toDate()
: new Date(data.timestamp || Date.now());

    const record: AuditPdfRecord = {
      audit_id: auditId,
      generated_at: ts.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ''),
      decision: result.decision,
      credit_limit: result.credit_limit,
      risk_score: result.risk_score,
      confidence: result.confidence,
      engine_version: result.engine_version,
      panMasked: request.panMasked || rbi.panMasked || '******XXXX',
      bank: request.bank ?? null,
      period: request.period ?? null,
      loan_request: request.loan_request ?? null,
      reasons: result.reasons || [],
      rules_fired: result.rules_fired || [],
      signals: data.signals || rbi.signals,
      policy_id: rbi.policyId || 'pilot-acme',
      policy_version: rbi.policyVersion || result.engine_version,
      config_hash: rbi.policyHash || '',
      error: result.error,
    };

    const pdf = renderAuditPdf(record);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="gavel-audit-${auditId}.pdf"`);
    res.setHeader('Content-Length', String(pdf.length));
    return res.status(200).send(pdf);
  } catch (err) {
    console.error('Audit PDF render error:', err);
    return res.status(500).json({
      error: { code: 'E500', message: 'Failed to render audit PDF' },
    });
  }
});

export default router;
