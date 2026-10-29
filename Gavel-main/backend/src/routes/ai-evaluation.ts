import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { 
  evaluateLoanApplication, 
  analyzeBankStatement, 
  generateLoanAgreement 
} from '../services/ai-evaluation';

const router = Router();

// Full AI Evaluation of a loan application
router.post('/evaluate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { borrowerData, useAI } = req.body;

    if (!borrowerData) {
      return res.status(400).json({ error: 'borrowerData is required' });
    }

    const startTime = Date.now();
    const evaluation = await evaluateLoanApplication(borrowerData);
    const processingTime = Date.now() - startTime;

    res.status(200).json({
      ...evaluation,
      processingTime: `${processingTime}ms`,
      model: 'gemini-1.5-flash',
      evaluatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Evaluation error:', error);
    res.status(500).json({ error: 'Failed to evaluate application' });
  }
});

// Analyze bank statement
router.post('/analyze-bank-statement', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { statementText } = req.body;

    if (!statementText) {
      return res.status(400).json({ error: 'statementText is required' });
    }

    const analysis = await analyzeBankStatement(statementText);

    res.status(200).json(analysis);
  } catch (error) {
    console.error('Bank statement analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze bank statement' });
  }
});

// Generate loan agreement
router.post('/generate-agreement', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { borrowerData, loanDetails } = req.body;

    if (!borrowerData || !loanDetails) {
      return res.status(400).json({ error: 'borrowerData and loanDetails are required' });
    }

    const agreement = await generateLoanAgreement(borrowerData, loanDetails);

    res.status(200).json({ agreement });
  } catch (error) {
    console.error('Agreement generation error:', error);
    res.status(500).json({ error: 'Failed to generate agreement' });
  }
});

// Batch evaluation for multiple applications
router.post('/batch-evaluate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { applications } = req.body;

    if (!Array.isArray(applications) || applications.length === 0) {
      return res.status(400).json({ error: 'applications array is required' });
    }

    const results = await Promise.all(
      applications.map(async (app: any) => {
        const evaluation = await evaluateLoanApplication(app.borrowerData);
        return {
          applicationId: app.id,
          ...evaluation
        };
      })
    );

    const approved = results.filter(r => r.decision === 'approved').length;
    const rejected = results.filter(r => r.decision === 'rejected').length;
    const review = results.filter(r => r.decision === 'review').length;

    res.status(200).json({
      total: results.length,
      approved,
      rejected,
      review,
      results
    });
  } catch (error) {
    console.error('Batch evaluation error:', error);
    res.status(500).json({ error: 'Failed to process batch evaluation' });
  }
});

// AI chat for underwriting assistant
router.post('/chat', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    // Use the existing copilot logic
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        response: "AI chat is not configured. Please set GEMINI_API_KEY in environment variables.",
        context: context || {}
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `You are GavelBot, an expert AI Underwriting Analyst for NBFCs in India. 
Help the user with:
- Loan application evaluation
- Credit risk analysis
- Policy compliance questions
- Borrower profile assessment

Be concise, professional, and actionable.`;

    const chat = model.startChat({
      history: context?.history || [],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.3,
      }
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    res.status(200).json({
      response,
      context: {
        history: [
          ...(context?.history || []),
          { role: 'user', content: message },
          { role: 'model', content: response }
        ]
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      response: "I'm having trouble processing your request. Please try again.",
      context: { history: [] }
    });
  }
});

// Get AI configuration status
router.get('/status', async (req: AuthenticatedRequest, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  res.status(200).json({
    configured: !!apiKey,
    model: 'gemini-1.5-flash',
    features: {
      loanEvaluation: true,
      bankStatementAnalysis: true,
      agreementGeneration: true,
      chat: true,
      batchProcessing: true
    }
  });
});

export default router;