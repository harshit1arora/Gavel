import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/firebase';

const router = Router();

router.get('/audit-logs', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const { entityType, action, status, startDate, endDate, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);

    let query: any = db.collection('audit_logs').where('orgId', '==', orgId);

    if (entityType && entityType !== 'all') query = query.where('entityType', '==', entityType);
    if (action) query = query.where('action', '==', action);
    if (status && status !== 'all') query = query.where('status', '==', status);

    const snapshot = await query
      .orderBy('timestamp', 'desc')
      .offset((pageNum - 1) * limitNum)
      .limit(limitNum)
      .get();

    let logs = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
    }));

    if (startDate) {
      const start = new Date(startDate as string);
      logs = logs.filter((l: any) => new Date(l.timestamp) >= start);
    }
    if (endDate) {
      const end = new Date(endDate as string);
      logs = logs.filter((l: any) => new Date(l.timestamp) <= end);
    }

    res.status(200).json({ total: logs.length, page: pageNum, limit: limitNum, logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/audit-logs/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const doc = await db.collection('audit_logs').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Audit log not found' });
    if (doc.data()!.orgId !== orgId) return res.status(403).json({ error: 'Unauthorized' });
    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/violations', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const { severity, resolved } = req.query;

    let query: any = db.collection('policy_violations').where('orgId', '==', req.orgId!);
    if (severity && severity !== 'all') query = query.where('severity', '==', severity);
    if (resolved !== undefined) query = query.where('resolved', '==', resolved === 'true');

    const snapshot = await query.orderBy('timestamp', 'desc').limit(100).get();
    const violations = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    res.status(200).json(violations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/violations/:id/resolve', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const doc = await db.collection('policy_violations').doc(req.params.id).get();
    if (!doc.exists || doc.data()!.orgId !== orgId) {
      return res.status(404).json({ error: 'Violation not found' });
    }

    const { resolvedBy, resolution } = req.body;

    await db.collection('policy_violations').doc(req.params.id).update({
      resolved: true,
      resolvedBy: resolvedBy || 'Admin',
      resolvedAt: new Date(),
      resolution: resolution || '',
    });

    res.status(200).json({ success: true, message: 'Violation resolved' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/reports', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const { type, status } = req.query;

    let query: any = db.collection('generated_reports').where('orgId', '==', orgId);
    if (type && type !== 'all') query = query.where('type', '==', type);
    if (status && status !== 'all') query = query.where('status', '==', status);

    const snapshot = await query.orderBy('generatedAt', 'desc').limit(50).get();
    const reports = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    res.status(200).json(reports);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reports/generate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const { name, type, period, format } = req.body;

    if (!name || !type || !period) {
      return res.status(400).json({ error: 'name, type, and period are required' });
    }

    const reportId = `rpt_${Date.now()}`;

    await db.collection('generated_reports').doc(reportId).set({
      id: reportId,
      orgId: req.orgId!,
      name,
      type,
      period,
      format: format || 'pdf',
      status: 'generating',
      generatedAt: new Date(),
      createdAt: new Date(),
    });

    res.status(201).json({ id: reportId, name, type, period, status: 'generating' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/metrics/summary', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const auditSnapshot = await db.collection('audit_logs').where('orgId', '==', orgId).get();
    const violationSnapshot = await db.collection('policy_violations').where('orgId', '==', orgId).get();
    const reportSnapshot = await db.collection('generated_reports').where('orgId', '==', orgId).get();

    const violations = violationSnapshot.docs.map((doc: any) => doc.data());
    const pendingViolations = violations.filter((v: any) => !v.resolved).length;
    const criticalViolations = violations.filter((v: any) => v.severity === 'critical' && !v.resolved).length;
    const reports = reportSnapshot.docs.map((doc: any) => doc.data());
    const readyReports = reports.filter((r: any) => r.status === 'ready').length;

    res.status(200).json({
      totalAuditLogs: auditSnapshot.size,
      violationsFound: violations.length,
      pendingViolations,
      criticalViolations,
      reportsReady: readyReports,
      totalReports: reports.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;