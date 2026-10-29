import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  fetchCreditReport,
  recordConsent,
  getBureauHistory,
  getLatestReport,
  calculateCreditMetrics,
  getCreditScore,
} from '../services/bureau-service';
import { db } from '../config/firebase';

const router = Router();

router.post('/consent', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { borrowerId, pan, purpose, bureau = 'CIBIL' } = req.body;

    if (!borrowerId || !pan || !purpose) {
      return res.status(400).json({ error: 'borrowerId, pan, and purpose are required' });
    }

    const panRegex = /^[A-Z]{3}[ABCHJLPTF]{1}[A-Z]{1}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(pan.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid PAN format' });
    }

    const consent = await recordConsent(
      req.orgId!,
      borrowerId,
      pan.toUpperCase(),
      purpose,
      req.ip,
      req.headers['user-agent'] as string,
      bureau
    );

    res.status(201).json({
      consentId: consent.id,
      expiresAt: consent.expiresAt,
      status: consent.status,
      message: 'Consent recorded successfully',
    });
  } catch (error: any) {
    console.error('Record consent error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to record consent' });
  }
});

router.get('/consent/:borrowerId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snapshot = await db.collection('bureau_consents')
      .where('orgId', '==', req.orgId!)
      .where('borrowerId', '==', req.params.borrowerId)
      .where('status', '==', 'active')
      .orderBy('grantedAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return res.status(404).json({ error: 'No active consent found' });

    const consent = snapshot.docs[0].data();
    res.status(200).json({ id: snapshot.docs[0].id, ...consent });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/fetch', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { borrowerId, pan, consentId } = req.body;

    if (!borrowerId || !pan) {
      return res.status(400).json({ error: 'borrowerId and pan are required' });
    }

    const panRegex = /^[A-Z]{3}[ABCHJLPTF]{1}[A-Z]{1}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(pan.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid PAN format' });
    }

    const report = await fetchCreditReport(req.orgId!, borrowerId, pan.toUpperCase(), consentId);

    res.status(200).json(report);
  } catch (error: any) {
    console.error('Fetch bureau report error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to fetch bureau report' });
  }
});

router.get('/score/:borrowerId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { borrowerId } = req.params;
    const { pan } = req.query;

    if (!pan) {
      const latest = await getLatestReport(req.orgId!, borrowerId);
      if (!latest) {
        return res.status(404).json({ error: 'No bureau report found. Please fetch first.' });
      }
      return res.status(200).json({
        score: latest.score,
        band: latest.scoreBand,
        provider: latest.provider,
        reportId: latest.reportId,
        reportDate: latest.reportDate,
      });
    }

    const result = await getCreditScore(req.orgId!, borrowerId, pan as string);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get credit score' });
  }
});

router.get('/history/:borrowerId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { borrowerId } = req.params;
    const { pan } = req.query;

    if (!pan) return res.status(400).json({ error: 'pan query param required' });

    const history = await getBureauHistory(req.orgId!, borrowerId, pan as string);
    res.status(200).json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/analyze', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reportId } = req.body;

    if (!reportId) {
      return res.status(400).json({ error: 'reportId is required' });
    }

    const reportDoc = await db.collection('bureau_reports').doc(reportId).get();
    if (!reportDoc.exists) {
      return res.status(404).json({ error: 'Bureau report not found' });
    }

    const report = reportDoc.data() as any;
    if (report.orgId !== req.orgId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const metrics = await calculateCreditMetrics(report);

    await db.collection('bureau_analysis').doc(`${req.orgId}_${reportId}`).set({
      reportId,
      orgId: req.orgId!,
      ...metrics,
      analyzedAt: new Date(),
    });

    res.status(200).json({
      score: report.score,
      scoreBand: report.scoreBand,
      ...metrics,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/scoreband/:score', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const score = parseInt(req.params.score);

    let band: string;
    if (score >= 800) band = 'Excellent';
    else if (score >= 750) band = 'Very Good';
    else if (score >= 700) band = 'Good';
    else if (score >= 650) band = 'Fair';
    else if (score >= 550) band = 'Average';
    else band = 'Poor';

    let grade: string;
    if (score >= 750) grade = 'A';
    else if (score >= 700) grade = 'B';
    else if (score >= 650) grade = 'C';
    else if (score >= 550) grade = 'D';
    else grade = 'E';

    res.status(200).json({ score, band, grade });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;