import { Router } from 'express';
import { FieldPath } from 'firebase-admin/firestore';
import { z } from 'zod';
import { AuthenticatedRequest, authenticateFirebaseToken } from '../middleware/auth';
import { db } from '../config/firebase';
import { loadPilotPolicy } from '../config/policy-loader';
import { candidatePolicy, replayCase, replayable } from '../services/policy-replay';
import { importPage, queue, reconcile } from '../services/reconciliation';

const router = Router();
router.use(authenticateFirebaseToken);
const cursor = z.string().min(1).max(512).regex(/^[^/]+$/).nullish();
const replayRequest = z.object({ policy: candidatePolicy, cursor });
router.get('/policy', (_req, res) => res.json(loadPilotPolicy().policy));
router.post('/replay', async (req: AuthenticatedRequest,res,next) => {
  try {
    const input = replayRequest.safeParse(req.body);
    if (!input.success) return res.status(400).json({ error: input.error.issues.map(v => v.path.join('.') + ' ' + v.message).join('; ') });
    const { policy, hash } = loadPilotPolicy();
    let query = db.collection('audit_logs').where('orgId','==',req.orgId).where('action','==','UNDERWRITING_ANALYZED')
      .orderBy(FieldPath.documentId()).limit(51);
    if (input.data.cursor) query = query.startAfter(input.data.cursor);
    const docs = (await query.get()).docs;
    const skipped: string[] = [];
    const cases = docs.slice(0,50).flatMap(d => {
      const row = d.data();
      if (!replayable(row.signals, row.result)) { skipped.push(d.id); return []; }
      const original = row.policySnapshot || (row.rbiComplianceFields?.policyHash === hash ? policy : undefined);
      return [replayCase(d.id, row.signals, row.result, input.data.policy, original)];
    });
    res.json({ cases, skipped, next: docs.length > 50 ? docs[49].id : null });
  } catch (err) { next(err); }
});
router.use('/settlements', (req: AuthenticatedRequest,res,next) => req.billingAdmin ? next() : res.status(403).json({ error: 'Billing administrator required' }));
router.post('/settlements/import', async (req: AuthenticatedRequest,res,next) => {
  try {
    const input = z.object({ date: z.string().date(), skip: z.number().int().nonnegative().default(0) }).safeParse(req.body);
    if (!input.success) return res.status(400).json({ error:'Expected a settlement date and offset' });
    res.json(await importPage(req.orgId!,input.data.date,input.data.skip));
  } catch (err) { next(err); }
});
router.get('/settlements', async (req: AuthenticatedRequest,res,next) => {
  try {
    const after = cursor.parse(req.query.cursor);
    let query = queue(req.orgId!).where('status','==','open').orderBy(FieldPath.documentId()).limit(51);
    if (after) query = query.startAfter(after);
    const rows = (await query.get()).docs;
    res.json({ items: rows.slice(0,50).map(d => ({ id:d.id,...d.data() })), next: rows.length > 50 ? rows[49].id : null });
  } catch(err) { next(err); }
});
router.post('/settlements/:id/repair', async (req: AuthenticatedRequest,res,next) => {
  try {
    const input = z.object({ reason:z.string().trim().min(1).max(500), emiNo:z.number().int().positive().optional() }).safeParse(req.body);
    if (!input.success || !/^[\w-]+$/.test(req.params.id)) return res.status(400).json({ error:'A repair reason and valid issue ID are required' });
    const row = (await queue(req.orgId!).doc(req.params.id).get()).data();
    if (!row || row.settlement.orgId !== req.orgId) return res.status(404).json({ error:'Unknown discrepancy' });
    try { res.json(await reconcile(row.settlement,true,req.uid,input.data.reason,input.data.emiNo)); }
    catch(err) { res.status(409).json({ error:err instanceof Error ? err.message : 'Repair conflict' }); }
  } catch(err) { next(err); }
});
export default router;
