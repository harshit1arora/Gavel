import express, { Request, Response } from 'express';
import admin from 'firebase-admin';
import multer from 'multer';
import path from 'path';
import os from 'os';
import BankStatementParser, { ParsedBankStatement } from '../services/bank-statement-parser';

const router = express.Router();
const db = admin.firestore();

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const tmpDir = path.join(os.tmpdir(), 'bank-statements');
      cb(null, tmpDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and images allowed.'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

/**
 * POST /statement-analysis/parse
 * Upload and parse bank statement
 */
router.post('/parse', upload.single('statement'), async (req: Request, res: Response) => {
  try {
    const { applicationId, userId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const parsedStatement = await BankStatementParser.parseStatement(
      req.file.path,
      userId || 'anonymous',
      applicationId || `app_${Date.now()}`
    );

    const docId = await BankStatementParser.saveToFirestore(parsedStatement, db);

    res.json({
      success: true,
      data: {
        id: docId,
        ...parsedStatement,
      },
    });
  } catch (error) {
    console.error('Statement parsing error:', error);
    res.status(500).json({
      error: 'Failed to parse statement',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /statement-analysis/:applicationId
 * Get parsed statement for application
 */
router.get('/:applicationId', async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;

    // Get application to find statement ID
    const appDoc = await db.collection('applications').doc(applicationId).get();
    if (!appDoc.exists) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const appData = appDoc.data();
    const statementId = appData?.bankStatementAnalysisId;

    if (!statementId) {
      return res.status(404).json({ error: 'No statement parsed for this application' });
    }

    // Get statement
    const stmtDoc = await db.collection('bankStatementAnalysis').doc(statementId).get();
    if (!stmtDoc.exists) {
      return res.status(404).json({ error: 'Statement not found' });
    }

    res.json({
      success: true,
      data: stmtDoc.data(),
    });
  } catch (error) {
    console.error('Error fetching statement:', error);
    res.status(500).json({ error: 'Failed to fetch statement' });
  }
});

/**
 * GET /statement-analysis/:applicationId/summary
 * Get concise summary of statement
 */
router.get('/:applicationId/summary', async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;

    const appDoc = await db.collection('applications').doc(applicationId).get();
    if (!appDoc.exists) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const appData = appDoc.data();
    const statementId = appData?.bankStatementAnalysisId;

    if (!statementId) {
      return res.status(404).json({ error: 'No statement parsed' });
    }

    const stmtDoc = await db.collection('bankStatementAnalysis').doc(statementId).get();
    if (!stmtDoc.exists) {
      return res.status(404).json({ error: 'Statement not found' });
    }

    const stmt = stmtDoc.data() as ParsedBankStatement;

    // Return summary only
    res.json({
      success: true,
      data: {
        monthlyRecurringIncome: stmt.monthlyRecurringIncome,
        avgMonthlyExpense: stmt.avgMonthlyExpense,
        existingEmiAmount: stmt.existingEmiAmount,
        savingsRatio: stmt.savingsRatio,
        emiToIncomeRatio: stmt.emiToIncomeRatio,
        incomeStability: stmt.incomeStability,
        redFlags: stmt.redFlags,
        positiveSignals: stmt.positiveSignals,
        confidence: stmt.confidence,
      },
    });
  } catch (error) {
    console.error('Error fetching statement summary:', error);
    res.status(500).json({ error: 'Failed to fetch statement summary' });
  }
});

/**
 * DELETE /statement-analysis/:statementId
 * Delete parsed statement
 */
router.delete('/:statementId', async (req: Request, res: Response) => {
  try {
    const { statementId } = req.params;

    await db.collection('bankStatementAnalysis').doc(statementId).delete();

    res.json({ success: true, message: 'Statement deleted' });
  } catch (error) {
    console.error('Error deleting statement:', error);
    res.status(500).json({ error: 'Failed to delete statement' });
  }
});

export default router;
