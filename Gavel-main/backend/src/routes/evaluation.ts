import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { evaluateApplication, getEvaluation, getEvaluationByApplication } from '../services/evaluation-engine';

const router = Router();

router.post('/evaluate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const input = req.body;

    if (!input.applicationId || !input.borrowerId || !input.pan) {
      return res.status(400).json({ error: 'applicationId, borrowerId, and pan are required' });
    }

    if (!input.loanAmount || input.loanAmount <= 0) {
      return res.status(400).json({ error: 'Valid loanAmount is required' });
    }

    if (!input.borrowerName || !input.phone) {
      return res.status(400).json({ error: 'borrowerName and phone are required' });
    }

    const evaluation = await evaluateApplication({
      orgId: req.orgId!,
      applicationId: input.applicationId,
      borrowerId: input.borrowerId,
      borrowerName: input.borrowerName,
      pan: input.pan,
      phone: input.phone,
      email: input.email,
      monthlyIncome: input.monthlyIncome,
      monthlyExpense: input.monthlyExpense,
      existingObligations: input.existingObligations,
      loanAmount: input.loanAmount,
      loanTenor: input.loanTenor || 24,
      loanType: input.loanType,
      employmentType: input.employmentType,
      companyName: input.companyName,
      yearsAtJob: input.yearsAtJob,
      houseOwnership: input.houseOwnership,
      vehicleOwned: input.vehicleOwned,
      bankBalance: input.bankBalance,
      bureauReportId: input.bureauReportId,
      bankStatementData: input.bankStatementData,
    });

    res.status(200).json(evaluation);
  } catch (error: any) {
    console.error('Evaluation error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to evaluate application' });
  }
});

router.get('/eval/:evaluationId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const evaluation = await getEvaluation(req.params.evaluationId);
    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }
    res.status(200).json(evaluation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/application/:applicationId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const evaluation = await getEvaluationByApplication(req.params.applicationId);
    if (!evaluation) {
      return res.status(404).json({ error: 'No evaluation found for this application' });
    }
    res.status(200).json(evaluation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/batch', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { applications } = req.body;

    if (!Array.isArray(applications) || applications.length === 0) {
      return res.status(400).json({ error: 'applications array required' });
    }

    if (applications.length > 100) {
      return res.status(400).json({ error: 'Max 100 applications per batch' });
    }

    const results = [];
    for (const app of applications) {
      try {
        const evaluation = await evaluateApplication({
          orgId: req.orgId!,
          applicationId: app.applicationId,
          borrowerId: app.borrowerId,
          borrowerName: app.borrowerName,
          pan: app.pan,
          phone: app.phone,
          email: app.email,
          monthlyIncome: app.monthlyIncome,
          monthlyExpense: app.monthlyExpense,
          existingObligations: app.existingObligations,
          loanAmount: app.loanAmount,
          loanTenor: app.loanTenor || 24,
          employmentType: app.employmentType,
          yearsAtJob: app.yearsAtJob,
          houseOwnership: app.houseOwnership,
        });
        results.push({ applicationId: app.applicationId, evaluation, status: 'success' });
      } catch (error: any) {
        results.push({ applicationId: app.applicationId, error: error.message, status: 'failed' });
      }
    }

    const approved = results.filter((r: any) => r.status === 'success' && r.evaluation?.decision === 'approve').length;
    const declined = results.filter((r: any) => r.status === 'success' && r.evaluation?.decision === 'decline').length;
    const review = results.filter((r: any) => r.status === 'success' && (r.evaluation?.decision === 'review' || r.evaluation?.decision === 'manual')).length;

    res.status(200).json({
      total: applications.length,
      approved,
      declined,
      review,
      failed: results.length - approved - declined - review,
      results,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;