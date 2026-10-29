import express, { Request, Response } from 'express';
import admin from 'firebase-admin';
import MLPredictionEngine, { LoanPredictionRequest, LoanPredictionResult } from '../services/ml-prediction-engine';

const router = express.Router();
const db = admin.firestore();

/**
 * POST /prediction/predict
 * Get loan approval prediction for an application
 */
router.post('/predict', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      applicationId,
      age,
      employmentType,
      monthlyIncome,
      existingEmi,
      creditScore,
      accountsActive,
      accountsDelinquent,
      maxDpd,
      inquiries90Days,
      bankStatementId,
      requestedLoanAmount,
      requestedTenure,
      loanPurpose,
    } = req.body;

    if (!monthlyIncome || !requestedLoanAmount) {
      return res.status(400).json({ error: 'Missing required fields: monthlyIncome, requestedLoanAmount' });
    }

    if (monthlyIncome <= 0 || requestedLoanAmount <= 0) {
      return res.status(400).json({ error: 'Income and loan amount must be positive' });
    }

    // Build prediction request
    const predictionRequest: LoanPredictionRequest = {
      userId,
      applicationId,
      age,
      employmentType,
      monthlyIncome,
      existingEmi,
      creditScore,
      accountsActive,
      accountsDelinquent,
      maxDpd,
      inquiries90Days,
      bankStatementId,
      requestedLoanAmount,
      requestedTenure,
      loanPurpose,
    };

    // Get prediction
    const prediction = await MLPredictionEngine.predictLoanApproval(predictionRequest);

    // Save prediction to Firestore for tracking
    await db.collection('loanPredictions').add({
      userId,
      applicationId,
      prediction,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({
      error: 'Failed to generate prediction',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /prediction/quick-estimate
 * Quick form-based estimate (less accurate but faster)
 * For real-time UI feedback as user fills form
 */
router.post('/quick-estimate', async (req: Request, res: Response) => {
  try {
    const { monthlyIncome, existingEmi, creditScore, employmentType, loanAmount } = req.body;

    if (!monthlyIncome || !loanAmount) {
      return res.status(400).json({ error: 'Missing monthlyIncome or loanAmount' });
    }

    // Quick request with minimal fields
    const predictionRequest: LoanPredictionRequest = {
      userId: 'anonymous',
      applicationId: 'form-' + Date.now(),
      monthlyIncome,
      existingEmi: existingEmi || 0,
      creditScore: creditScore || 700,
      employmentType,
      requestedLoanAmount: loanAmount,
      requestedTenure: 60,
    };

    const prediction = await MLPredictionEngine.predictLoanApproval(predictionRequest);

    // Return limited fields for UI (reduce payload)
    res.json({
      success: true,
      data: {
        approvalScore: prediction.approvalScore,
        approvalProbability: prediction.approvalProbability,
        maxApprovableAmount: prediction.maxApprovableAmount,
        estimatedMonthlyEmi: prediction.estimatedMonthlyEmi,
        riskCategory: prediction.riskCategory,
        decision: prediction.decision,
      },
    });
  } catch (error) {
    console.error('Quick estimate error:', error);
    res.status(500).json({ error: 'Failed to generate estimate' });
  }
});

/**
 * GET /prediction/history
 * Get prediction history for user
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const predictions = await db.collection('loanPredictions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const data = predictions.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching prediction history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

/**
 * GET /prediction/:predictionId
 * Get specific prediction details
 */
router.get('/:predictionId', async (req: Request, res: Response) => {
  try {
    const { predictionId } = req.params;

    const predDoc = await db.collection('loanPredictions').doc(predictionId).get();
    if (!predDoc.exists) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    res.json({
      success: true,
      data: {
        id: predDoc.id,
        ...predDoc.data(),
      },
    });
  } catch (error) {
    console.error('Error fetching prediction:', error);
    res.status(500).json({ error: 'Failed to fetch prediction' });
  }
});

/**
 * POST /prediction/scenarios
 * Compare multiple scenarios (different loan amounts/tenures)
 */
router.post('/scenarios', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      applicationId,
      monthlyIncome,
      existingEmi,
      creditScore,
      employmentType,
      scenarios,
    } = req.body;

    if (!scenarios || !Array.isArray(scenarios) || scenarios.length === 0) {
      return res.status(400).json({ error: 'Scenarios array required' });
    }

    const predictions = await Promise.all(
      scenarios.map(scenario =>
        MLPredictionEngine.predictLoanApproval({
          userId,
          applicationId,
          monthlyIncome,
          existingEmi,
          creditScore,
          employmentType,
          requestedLoanAmount: scenario.loanAmount,
          requestedTenure: scenario.tenure,
          loanPurpose: scenario.purpose,
        })
      )
    );

    res.json({
      success: true,
      data: predictions.map((pred, i) => ({
        scenario: scenarios[i],
        prediction: pred,
      })),
    });
  } catch (error) {
    console.error('Scenario comparison error:', error);
    res.status(500).json({ error: 'Failed to compare scenarios' });
  }
});

export default router;
