import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateFirebaseToken } from '../middleware/auth';
import { enforceQuota } from '../middleware/quota';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db, Timestamp } from '../config/firebase';
import crypto from 'crypto';

const router = Router();

export interface ConversationMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export interface CopilotConversation {
  id: string;
  orgId: string;
  borrowerId?: string;
  loanId?: string;
  subject?: string;
  messages: ConversationMessage[];
  context: {
    borrowerData?: any;
    loanData?: any;
    productData?: any;
    orgPolicies?: any;
  };
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '';
const NVIDIA_API_URL = process.env.NVIDIA_API_URL || 'https://integrate.api.nvidia.com/v1/chat/completions';

const SYSTEM_INSTRUCTION = `You are GavelBot, an expert AI Underwriting Analyst Copilot built into the Gavel AI platform.
You are assisting a Credit Manager in evaluating complex loan applications.
Be highly professional, analytical, concise, and deterministic. Avoid fluff.
Always cite specific data points from the borrower profile when answering.`;

function validateOrgId(orgId: string): boolean {
  return /^[a-zA-Z0-9_-]{1,128}$/.test(orgId);
}

function sanitizeString(str: unknown, maxLen = 10000): string {
  if (typeof str !== 'string') return '';
  return str.substring(0, maxLen).replace(/<script|<\/script|eval\(/gi, '');
}

// ==================== CONVERSATIONS ====================

router.post('/conversations', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!validateOrgId(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const { borrowerData, loanData, productData, orgPolicies, subject } = req.body;

    const conversationId = `conv_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const conversation: CopilotConversation = {
      id: conversationId,
      orgId,
      loanId: loanData?.id || undefined,
      subject: subject || 'Loan Evaluation',
      messages: [],
      context: {
        borrowerData: borrowerData || null,
        loanData: loanData || null,
        productData: productData || null,
        orgPolicies: orgPolicies || null,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessageAt: new Date(),
    };

    await db.collection('copilot_conversations').doc(conversationId).set(conversation);

    res.status(201).json({ id: conversationId, message: 'Conversation created', subject: conversation.subject });
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

router.get('/conversations', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { loanId, limit = '20' } = req.query;
    const limitNum = Math.min(parseInt(limit as string), 100);

    let query: any = db.collection('copilot_conversations').where('orgId', '==', req.orgId!);
    if (loanId) query = query.where('loanId', '==', loanId);

    const snapshot = await query
.orderBy('updatedAt', 'desc')
.limit(limitNum)
.get();

    const conversations = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        subject: data.subject,
        loanId: data.loanId,
        lastMessageAt: data.lastMessageAt,
        messageCount: data.messages.length,
        createdAt: data.createdAt,
      };
    });

    res.status(200).json(conversations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/conversations/:conversationId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = await db.collection('copilot_conversations').doc(req.params.conversationId).get();
    if (!doc.exists || doc.data()!.orgId !== req.orgId) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const data = doc.data()!;
    res.status(200).json({
      id: doc.id,
      subject: data.subject,
      messages: data.messages,
      context: data.context,
      createdAt: data.createdAt,
      lastMessageAt: data.lastMessageAt,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SEND MESSAGE ====================

router.post('/conversations/:conversationId/message', enforceQuota, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!validateOrgId(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    if (prompt.length > 5000) {
      return res.status(400).json({ error: 'Prompt too long (max 5000 characters)' });
    }

    const doc = await db.collection('copilot_conversations').doc(req.params.conversationId).get();
    if (!doc.exists || doc.data()!.orgId !== orgId) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const conversation = doc.data() as CopilotConversation;

    const userMessage: ConversationMessage = {
      role: 'user',
      content: sanitizeString(prompt),
      timestamp: new Date(),
    };

    const contextStr = conversation.context.borrowerData
      ? `Borrower Data: ${JSON.stringify(conversation.context.borrowerData, null, 2)}`
: '';

    let replyText = '';

    if (NVIDIA_API_KEY) {
      replyText = await queryNvidiaCopilot(prompt, contextStr, conversation.messages);
    } else if (GEMINI_API_KEY) {
      replyText = await queryGeminiCopilot(prompt, conversation.messages, conversation.context);
    } else {
      replyText = generateMockCopilotResponse(prompt, conversation.messages, conversation.context);
    }

    const modelMessage: ConversationMessage = {
      role: 'model',
      content: replyText,
      timestamp: new Date(),
    };

    conversation.messages.push(userMessage, modelMessage);
    conversation.lastMessageAt = new Date();
    conversation.updatedAt = new Date();

    await doc.ref.update({
      messages: conversation.messages,
      lastMessageAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    await db.collection('audit_logs').add({
      orgId,
      action: 'COPILOT_MESSAGE',
      targetId: req.params.conversationId,
      detail: `Copilot message sent: "${prompt.substring(0, 50)}..."`,
      timestamp: Timestamp.now(),
    });

    res.json({
      reply: replyText,
      conversationId: req.params.conversationId,
      messageCount: conversation.messages.length,
    });
  } catch (error: any) {
    console.error('Copilot error:', error);
    res.status(500).json({ error: 'Failed to communicate with the Underwriting Copilot' });
  }
});

// ==================== DIRECT PROMPT (no conversation) ====================

router.post('/', enforceQuota, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!validateOrgId(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const { prompt, borrowerData, conversationHistory } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    if (prompt.length > 5000) {
      return res.status(400).json({ error: 'Prompt too long (max 5000 characters)' });
    }

    const contextStr = borrowerData
      ? JSON.stringify(sanitizeString(JSON.stringify(borrowerData), 10000), null, 2)
: '';

    let reply = '';

    if (NVIDIA_API_KEY) {
      reply = await queryNvidiaCopilot(prompt, contextStr, conversationHistory || []);
    } else if (GEMINI_API_KEY) {
      reply = await queryGeminiDirect(prompt, borrowerData, conversationHistory);
    } else {
      reply = generateMockCopilotResponse(prompt, conversationHistory || [], { borrowerData });
    }

    await db.collection('audit_logs').add({
      orgId,
      action: 'COPILOT_DIRECT_PROMPT',
      targetId: 'direct',
      detail: `Copilot prompt: "${prompt.substring(0, 50)}..."`,
      timestamp: Timestamp.now(),
    });

    res.json({ reply });
  } catch (error) {
    console.error('Copilot Error:', error);
    res.status(500).json({ error: 'Failed to communicate with the Underwriting Copilot' });
  }
});

// ==================== ANALYZE BORROWER ====================

router.post('/analyze', enforceQuota, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    const { borrowerData, loanData, loanAmount, monthlyIncome, employmentType, loanTenureMonths, loanPurpose } = req.body;

    const data = borrowerData || {
      loanAmount: loanAmount || 0,
      monthlyIncome: monthlyIncome || 0,
      employmentType: employmentType || 'Unknown',
      loanTenureMonths: loanTenureMonths || 0,
      loanPurpose: loanPurpose || 'General',
    };

    const prompt = `Analyze this loan application and provide a structured underwriting assessment.

Applicant Profile:
${JSON.stringify(data, null, 2)}

Provide your response in this EXACT JSON format:
{
  "creditScore": <number 300-900>,
  "riskLevel": "<low|medium|high>",
  "loanToIncomeRatio": <number>,
  "affordabilityScore": <number 0-100>,
  "approvalRecommendation": "<approve|review|reject>",
  "recommendedLoanAmount": <number or null>,
  "recommendedTenure": <number or null>,
  "recommendedRate": <number or null>,
  "keyStrengths": [<string>,...],
  "riskFlags": [<string>,...],
  "missingDocuments": [<string>,...],
  "underwritingNotes": "<detailed explanation>"
}`;

    let analysis = '';

    if (NVIDIA_API_KEY) {
      analysis = await queryNvidiaAnalyze(prompt);
    } else if (GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      analysis = result.response.text();
    } else {
      analysis = generateMockAnalysis(data);
    }

    let parsed: any = null;
    try {
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch {
      parsed = { rawAnalysis: analysis, note: 'Could not parse structured response' };
    }

    await db.collection('audit_logs').add({
      orgId,
      action: 'COPILOT_ANALYZE',
      targetId: 'analyze',
      detail: `Borrower analyzed via copilot`,
      timestamp: Timestamp.now(),
    });

    res.json({ analysis: parsed, raw: analysis });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// ==================== AI PROVIDERS ====================

async function queryGeminiCopilot(prompt: string, history: ConversationMessage[], context: CopilotConversation['context']): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key not configured');

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const contextBlock = context.borrowerData
    ? `Context: Borrower Data:\n${JSON.stringify(context.borrowerData, null, 2)}\n\nContext, Loan Data:\n${JSON.stringify(context.loanData || {}, null, 2)}`
: '';

  const formattedHistory = history.slice(-10).map(msg => ({
    role: msg.role === 'user' ? 'user': 'model',
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: `${SYSTEM_INSTRUCTION}\n\n${contextBlock}` }] },
      { role: 'model', parts: [{ text: 'Understood. I am GavelBot, ready to assist with underwriting analysis.' }] },
...formattedHistory,
    ],
    generationConfig: {
      maxOutputTokens: 1000,
      temperature: 0.2,
    },
  });

  const result = await chat.sendMessage(sanitizeString(prompt));
  return result.response.text();
}

async function queryGeminiDirect(prompt: string, borrowerData: any, history: any[]): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key not configured');

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const contextBlock = borrowerData
    ? `Borrower Data:\n${JSON.stringify(borrowerData, null, 2)}`
: '';

  const formattedHistory = (history || []).slice(-10).map((msg: any) => ({
    role: msg.role === 'user' ? 'user': 'model',
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: `${SYSTEM_INSTRUCTION}\n\n${contextBlock}` }] },
      { role: 'model', parts: [{ text: 'Understood.' }] },
...formattedHistory,
    ],
    generationConfig: {
      maxOutputTokens: 1000,
      temperature: 0.2,
    },
  });

  const result = await chat.sendMessage(sanitizeString(prompt));
  return result.response.text();
}

async function queryNvidiaCopilot(prompt: string, context: string, history: any[]): Promise<string> {
  if (!NVIDIA_API_KEY) throw new Error('Nvidia API key not configured');

  const messages: any[] = [
    { role: 'system', content: `${SYSTEM_INSTRUCTION}\n\n${context}` },
  ];

  (history || []).slice(-10).forEach((msg: any) => {
    messages.push({ role: msg.role === 'user' ? 'user': 'assistant', content: msg.content });
  });

  messages.push({ role: 'user', content: sanitizeString(prompt) });

  const response = await fetch(NVIDIA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'meta/llama-3.1-70b-instruct',
      messages,
      max_tokens: 1000,
      temperature: 0.2,
    }),
  });

  if (!response.ok) throw new Error('Nvidia API error');
  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response generated.';
}

async function queryNvidiaAnalyze(prompt: string): Promise<string> {
  if (!NVIDIA_API_KEY) throw new Error('Nvidia API key not configured');

  const response = await fetch(NVIDIA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'meta/llama-3.1-70b-instruct',
      messages: [
        { role: 'system', content: 'You are GavelBot, an expert underwriting analyst. Always respond with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2000,
      temperature: 0.1,
    }),
  });

  if (!response.ok) throw new Error('Nvidia API error');
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '{}';
}

function generateMockCopilotResponse(prompt: string, history: any[], context: any): string {
  const lower = prompt.toLowerCase();

  if (lower.includes('score') || lower.includes('credit')) {
    return 'Based on the borrower data, I estimate a credit score of **720**. Key factors: stable salary income (₹48,000/month), low existing obligations, and clean credit history. Recommendation: **Approve** with standard terms.';
  }
  if (lower.includes('risk') || lower.includes('flag')) {
    return 'Risk assessment complete. Primary concern: loan-to-income ratio at 18x, which is above the recommended 12x threshold. Secondary flags: recent credit inquiries (3 in last 6 months). Recommendation: **Manual Review** with additional documentation.';
  }
  if (lower.includes('recommend') || lower.includes('approve')) {
    return 'Recommendation: **Approve with conditions**. The borrower meets income criteria (>₹30,000/month) and has stable employment. Suggested loan amount: ₹2,00,000 at 14% p.a. for 24 months. EMI: ₹9,847/month, which is 20.5% of monthly income.';
  }
  if (lower.includes('reject') || lower.includes('deny')) {
    return 'Based on the data provided, this application shows: (1) LTI ratio exceeding 24x, (2) recent missed payments, (3) existing high-value EMIs. These factors indicate **elevated default risk**. Recommendation: **Reject** or request additional security/co-borrower.';
  }

  return 'I can help analyze credit risk, evaluate borrower profiles, check policy compliance, and generate underwriting recommendations. Please provide specific borrower data or ask a focused question about the loan application.';
}

function generateMockAnalysis(data: any): string {
  const income = data.monthlyIncome || data.monthly_income || 0;
  const loanAmount = data.loanAmount || data.loan_amount || 0;
  const lti = income > 0 ? Math.round(loanAmount / income): 0;

  let creditScore = 650;
  if (income >= 50000) creditScore += 100;
  else if (income >= 30000) creditScore += 50;
  if (lti <= 12) creditScore += 80;
  else if (lti <= 24) creditScore += 30;
  else creditScore -= 100;
  creditScore = Math.min(900, Math.max(300, creditScore));

  let riskLevel = 'medium';
  if (creditScore >= 750) riskLevel = 'low';
  else if (creditScore < 650) riskLevel = 'high';

  let recommendation = 'review';
  if (creditScore >= 730 && lti <= 18) recommendation = 'approve';
  else if (creditScore < 620 || lti > 30) recommendation = 'reject';

  return JSON.stringify({
    creditScore,
    riskLevel,
    loanToIncomeRatio: lti,
    affordabilityScore: Math.min(100, Math.max(0, 100 - lti)),
    approvalRecommendation: recommendation,
    recommendedLoanAmount: Math.round(loanAmount * 0.9),
    recommendedTenure: 24,
    recommendedRate: lti <= 12 ? 12: lti <= 20 ? 14: 16,
    keyStrengths: income >= 40000 ? ['High monthly income']: [],
    riskFlags: lti > 18 ? ['High loan-to-income ratio']: [],
    missingDocuments: [],
    underwritingNotes: `LTI ratio: ${lti}x. Income: ₹${income.toLocaleString('en-IN')}/month.`,
  });
}

export default router;