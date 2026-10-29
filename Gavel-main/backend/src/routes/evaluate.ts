import { Router, Response, Request } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/firebase';
import { fetchBureauData } from '../services/bureau';
import { dispatchWebhook } from '../services/webhooks';
import { enforceQuota } from '../middleware/quota';
import multer from 'multer';
import { GoogleGenerativeAI, Schema } from '@google/generative-ai';
const pdfParse = require('pdf-parse');

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

/**
 * @openapi
 * /evaluate:
 *   post:
 *     summary: Evaluate a loan application using the Gavel AI Engine
 *     tags: [Origination]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - applicantName
 *               - panNumber
 *               - annualIncome
 *               - loanAmount
 *             properties:
 *               applicantName:
 *                 type: string
 *               panNumber:
 *                 type: string
 *               annualIncome:
 *                 type: number
 *               loanAmount:
 *                 type: number
 *               creditDebt:
 *                 type: number
 *               applicationId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Application evaluated successfully
 *       400:
 *         description: Missing required fields
 */
router.post('/', enforceQuota, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    const { applicantName, panNumber, annualIncome, loanAmount, creditDebt, applicationId } = req.body;

    if (!applicantName || !panNumber || !annualIncome || !loanAmount) {
      return res.status(400).json({ error: 'Missing required fields: applicantName, panNumber, annualIncome, loanAmount' });
    }

    // Validate types
    if (typeof annualIncome !== 'number' || typeof loanAmount !== 'number') {
      return res.status(400).json({ error: 'annualIncome and loanAmount must be numbers' });
    }

    if (loanAmount <= 0 || annualIncome <= 0) {
      return res.status(400).json({ error: 'annualIncome and loanAmount must be positive' });
    }

    // PAN format validation (basic Indian PAN: 5 alpha + 4 digit + 1 alpha)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panNumber.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid PAN number format' });
    }

    // 1. Persist application
    let appRef;
    const appData = {
      orgId,
      applicantName: String(applicantName).trim(),
      annualIncome: Number(annualIncome),
      loanAmount: Number(loanAmount),
      creditDebt: Number(creditDebt || 0),
      status: 'Pending' as const,
      aiScore: null,
      aiReasoning: null,
      createdAt: new Date(),
      decidedAt: null,
    };

    if (applicationId) {
      appRef = db.collection('applications').doc(applicationId);
      await appRef.set(appData, { merge: true });
    } else {
      appRef = await db.collection('applications').add(appData);
    }

    // 2. Fetch Bureau Data
    const bureauData = await fetchBureauData(panNumber, loanAmount);

    // 3. Engine Evaluation (Risk Policies)
    const policiesQuery = await db.collection('policies').where('orgId', '==', orgId).limit(1).get();
    
    let status = 'Manual Review';
    let usedRule = 'Default fallthrough logic.';
    
    if (!policiesQuery.empty) {
      const policyData = policiesQuery.docs[0].data();
      
      const checkRules = (rules: any[]) => {
        if (!rules || !Array.isArray(rules)) return false;
        for (const rule of rules) {
           if (!rule.field || !rule.op || rule.value === undefined) continue;

           let evalVal: number = 0;
           if (rule.field === 'bureau_score') evalVal = bureauData.score;
           if (rule.field === 'loan_amount') evalVal = Number(loanAmount);
           if (rule.field === 'annual_income') evalVal = Number(annualIncome);
           
           let rulePasses = false;
           const ruleVal = parseFloat(rule.value);
           if (isNaN(ruleVal)) continue;

           if (rule.op === '>') rulePasses = evalVal > ruleVal;
           else if (rule.op === '<') rulePasses = evalVal < ruleVal;
           else if (rule.op === '>=') rulePasses = evalVal >= ruleVal;
           else if (rule.op === '<=') rulePasses = evalVal <= ruleVal;
           else if (rule.op === '===') rulePasses = evalVal === ruleVal;
           
           if (rulePasses) {
             usedRule = rule.description || `Rule match: ${rule.field} ${rule.op} ${rule.value}`;
             return true;
           }
        }
        return false;
      };

      if (bureauData.signals.fraudFlagsDetected) {
         status = 'Rejected';
         usedRule = 'Hard reject: Fraud signals detected across bureau networks.';
      } else if (checkRules(policyData['auto-reject'])) {
        status = 'Rejected';
      } else if (checkRules(policyData['auto-approve'])) {
        status = 'Approved';
      } else if (checkRules(policyData['manual-review'])) {
        status = 'Manual Review';
      }
    } else {
      if (bureauData.signals.fraudFlagsDetected) status = 'Rejected';
      else if (bureauData.score >= 700) status = 'Approved';
      else if (bureauData.score < 600) status = 'Rejected';
    }

    const aiReasoning = `Engine Rule: [${usedRule}]. Bureau → Score: ${bureauData.score}, DTI High: ${bureauData.signals.dtiRatioHigh ? 'Yes' : 'No'}, Stable History: ${bureauData.signals.bureauHitStable ? 'Yes' : 'No'}, Income Verified: ${bureauData.signals.incomeVerified ? 'Yes' : 'No'}.`;

    // 4. Update Database with decision timestamp
    await appRef.update({
      aiScore: bureauData.score,
      status,
      aiReasoning,
      decidedAt: new Date(),
    });

    // 5. RBI Compliant Audit Log
    await db.collection('audit_logs').add({
      orgId,
      action: 'APPLICATION_EVALUATED',
      targetId: appRef.id,
      detail: `Status: ${status}, Score: ${bureauData.score}, Rule: ${usedRule}`,
      actor: 'system_ai',
      timestamp: new Date(),
      // Strict RBI Fair Practices Code compliance fields
      rbiComplianceFields: {
        panMasked: "******" + panNumber.slice(-4),
        bureauSource: bureauData.provider,
        decisionRationale: usedRule,
        reviewerId: req.apiKeyId || req.uid || 'system',
        policyVersion: policiesQuery.empty ? 'default' : policiesQuery.docs[0].id
      }
    });

    // 6. Fire Webhook (async, non-blocking)
    dispatchWebhook(orgId, 'application.evaluated', {
      applicationId: appRef.id,
      status,
      score: bureauData.score,
      signals: bureauData.signals
    });

    res.status(200).json({
      applicationId: appRef.id,
      status,
      aiScore: bureauData.score,
      reasoning: aiReasoning
    });

  } catch (error) {
    console.error('Evaluate API Error:', error);
    res.status(500).json({ error: 'Internal server error during evaluation' });
  }
});

/**
 * @openapi
 * /evaluate/bank-statement:
 *   post:
 *     summary: Parse raw bank statements using Gavel ML
 *     description: Ingests raw PDF data and returns a structured cash flow analysis and risk score.
 *     tags: [Machine Learning]
 *     responses:
 *       200:
 *         description: Successfully parsed bank statement
 */
router.post('/bank-statement', enforceQuota, upload.single('statement'), async (req: any, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No PDF file uploaded.' });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      // Fallback to mock if no key
      return res.status(200).json({
        gavelRiskScore: Math.floor(Math.random() * (850 - 500) + 500),
        extractedData: {
          averageMonthlyBalance: 450000,
          inwardBounces: 0,
          outwardBounces: 1, // Red flag
          hiddenLiabilitiesDetected: true,
          primaryIncomeSource: "Business Receipts",
          salaryConsistency: 0.85
        },
        insights: [
          "Consistent daily deposits detected. High probability of retail MSME.",
          "Detected 1 outward bounce last month indicating mild liquidity stress.",
          "Undisclosed loan EMI payment detected to 'Bajaj Finance'."
        ]
      });
    }

    // 1. Extract text from PDF
    const pdfData = await pdfParse(file.buffer);
    const textContent = pdfData.text;

    // 2. Call Gemini
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      Analyze the following bank statement text and extract key financial metrics.
      You are an expert underwriter. Return a structured JSON ONLY. Do not include markdown blocks.
      
      Structure:
      {
        "gavelRiskScore": number (500-850),
        "extractedData": {
          "averageMonthlyBalance": number,
          "inwardBounces": number,
          "outwardBounces": number,
          "hiddenLiabilitiesDetected": boolean,
          "primaryIncomeSource": string,
          "salaryConsistency": number (0-1)
        },
        "insights": [string, string]
      }

      Bank Statement Text:
      ${textContent.substring(0, 30000)} // cap at 30k chars
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean JSON if it has markdown ticks
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    res.status(200).json(parsed);
  } catch (error: any) {
    console.error('LLM parsing error:', error);
    res.status(500).json({ error: 'Failed to parse document via LLM' });
  }
});

/**
 * @openapi
 * /evaluate/account-aggregator:
 *   post:
 *     summary: Fetch financial data via Account Aggregator
 */
router.post('/account-aggregator', async (req: Request, res: Response) => {
  // In a real integration, this would call Setu/Finvu APIs
  // For the demo, we return structured AA payload
  setTimeout(() => {
    res.status(200).json({
      gavelRiskScore: 780,
      extractedData: {
        averageMonthlyBalance: 850000,
        outwardBounces: 0,
        hiddenLiabilitiesDetected: false,
        primaryIncomeSource: "Salary",
        salaryConsistency: 0.98
      },
      insights: [
        "Setu AA: 6 months of HDFC Bank statements fetched securely.",
        "Salary consistency score: 98% (High Stability)",
        "No hidden liabilities detected."
      ]
    });
  }, 1500);
});

export default router;
