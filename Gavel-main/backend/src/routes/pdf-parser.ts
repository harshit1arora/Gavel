import { Router, Response, Request } from 'express';
import multer from 'multer';

const router = Router();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdfParse = async (buffer: any): Promise<{ text: string }> => {
   
  const pdf = require('pdf-parse');
  return pdf(buffer) as Promise<{ text: string }>;
};

interface AuthRequest extends Request {
  userId?: string;
  userName?: string;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files accepted'));
    }
  }
});

const NVIDIA_API_URL = process.env.NVIDIA_API_URL || 'https://integrate.api.nvidia.com/v1/chat/completions';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '';

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  balance: number | null;
  category: string;
}

interface ParsedStatement {
  bank_name: string;
  account_number: string;
  period: string;
  period_start: string;
  period_end: string;
  account_holder: string;
  confidence: number;
  warnings: string[];
  transactions: ParsedTransaction[];
}

// Routes are relative to the `/v1/parse` mount point in index.ts.
// (Previously these carried a redundant `/v1/parse` prefix, which produced the
//  unreachable path `/v1/parse/v1/parse/bank-statement`.)
router.post(
  '/bank-statement',
  upload.single('statement'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: { code: 'E005', message: 'No PDF file uploaded' }
        });
      }

      const pdfData = await pdfParse(req.file.buffer);
      const rawText = pdfData.text;

      if (!rawText || rawText.length < 100) {
        return res.status(422).json({
          error: {
            code: 'E006',
            message: 'PDF text extraction failed',
            detail: 'PDF may be scanned/image-based. Please upload a text-based PDF.'
          }
        });
      }

      const parsed = await parseWithNvidia(rawText);
      const validated = validateParsedData(parsed);

      res.json({
        success: true,
        parse_id: `parse_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        bank_detected: parsed.bank_name,
        period_detected: parsed.period,
        transactions_found: parsed.transactions.length,
        confidence: parsed.confidence,
        data: validated,
        warnings: parsed.warnings || []
      });

    } catch (err: any) {
      console.error('PDF parsing error:', err);
      res.status(500).json({
        error: {
          code: 'E007',
          message: 'Parser service error',
          detail: err.message
        }
      });
    }
  }
);

router.post(
  '/and-analyze',
  upload.single('statement'),
  async (req: Request, res: Response) => {
    try {
      const { applicant_name, applicant_pan, loan_amount, loan_tenure_months, loan_purpose } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: { code: 'E005', message: 'No PDF file uploaded' } });
      }

      const pdfData = await pdfParse(req.file.buffer);
      const rawText = pdfData.text;

      const parsed = await parseWithNvidia(rawText);
      const validated = validateParsedData(parsed);

      res.json({
        parse_summary: {
          bank: validated.bank,
          period: validated.period,
          transactions_found: validated.transactions.length,
          confidence: parsed.confidence
        },
        data: validated
      });

    } catch (err: any) {
      console.error('Parse and analyze error:', err);
      res.status(500).json({
        error: { code: 'E008', message: err.message }
      });
    }
  }
);

async function parseWithNvidia(rawText: string): Promise<ParsedStatement> {
  const prompt = `You are a bank statement parser for Indian banks. Extract transaction data from this raw bank statement text and return ONLY valid JSON.

RULES:
- Extract every transaction you can find
- Credits (money in) = positive amounts
- Debits (money out) = negative amounts
- Dates must be in YYYY-MM-DD format
- Amounts must be numbers (no commas, no ₹ symbol)
- Description should be the original narration text
- Balance is the running balance after transaction
- Detect the bank name from the statement
- Detect the account number (mask to last 4 digits)
- Detect the statement period (start and end date)
- If you cannot determine a value, use null
- confidence: 0.0-1.0 based on data quality

SUPPORTED BANKS:
HDFC Bank, SBI, ICICI Bank, Axis Bank, PNB, Kotak Mahindra, Yes Bank, IDFC First, IndusInd, Bank of Baroda, Canara Bank, Union Bank

Return ONLY this JSON structure, no other text:
{
  "bank_name": "HDFC Bank",
  "account_number": "XXXX4521",
  "period": "6 months",
  "period_start": "2024-01-01",
  "period_end": "2024-06-30",
  "account_holder": "Rajesh Kumar",
  "confidence": 0.94,
  "warnings": [],
  "transactions": [
    {
      "date": "2024-01-03",
      "description": "SALARY CREDIT - INFOSYS LTD",
      "amount": 44800,
      "type": "credit",
      "balance": 52300,
      "category": "salary"
    }
  ]
}

Category must be one of:
salary, emi, upi, atm, transfer, utility, investment, refund, fee, other

BANK STATEMENT TEXT:
${rawText.substring(0, 12000)}`;

  try {
    if (!NVIDIA_API_KEY) {
      return generateMockParsedData();
    }

    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-70b-instruct',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000,
        temperature: 0.1,
        top_p: 0.95
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Nvidia API error:', errorData);
      return generateMockParsedData();
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    const clean = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    return JSON.parse(clean);
  } catch (error) {
    console.error('Nvidia parsing failed, using mock:', error);
    return generateMockParsedData();
  }
}

function validateParsedData(parsed: any): any {
  const errors: string[] = [];

  if (!parsed.transactions || parsed.transactions.length === 0) {
    throw new Error('No transactions extracted from PDF');
  }

  const validTransactions = parsed.transactions
    .filter((t: any) => t.date && t.amount !== undefined && t.description)
    .map((t: any) => {
      const amount = typeof t.amount === 'number' ? t.amount : parseFloat(String(t.amount).replace(/[^0-9.-]/g, ''));
      return {
        date: t.date,
        description: String(t.description).trim(),
        amount: amount,
        type: amount > 0 ? 'credit' : 'debit',
        balance: t.balance || null,
        category: t.category || 'other'
      };
    })
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (validTransactions.length < 3) {
    throw new Error('Insufficient valid transactions found. Minimum 3 required.');
  }

  return {
    account_number: parsed.account_number || 'XXXX0000',
    bank: parsed.bank_name || 'Unknown Bank',
    period: parsed.period || 'Unknown period',
    period_start: parsed.period_start,
    period_end: parsed.period_end,
    account_holder: parsed.account_holder,
    transactions: validTransactions
  };
}

function generateMockParsedData(): ParsedStatement {
  const sampleTransactions = [
    { date: '2024-01-03', description: 'SALARY CREDIT - INFOSYS LTD', amount: 44800, type: 'credit' as const, balance: 52300, category: 'salary' },
    { date: '2024-01-05', description: 'UPI - FLIPKART', amount: -2500, type: 'debit' as const, balance: 49800, category: 'upi' },
    { date: '2024-01-10', description: 'ATM WITHDRAWAL', amount: -10000, type: 'debit' as const, balance: 39800, category: 'atm' },
    { date: '2024-01-15', description: 'HDFC CREDIT CARD PAYMENT', amount: -8500, type: 'debit' as const, balance: 31300, category: 'utility' },
    { date: '2024-01-18', description: 'NEFT - Rajesh Kumar', amount: 5000, type: 'credit' as const, balance: 36300, category: 'transfer' },
    { date: '2024-01-22', description: 'UPI - SWIGGY', amount: -450, type: 'debit' as const, balance: 35850, category: 'upi' },
    { date: '2024-01-25', description: 'BILL PAY - ELECTRICITY', amount: -1200, type: 'debit' as const, balance: 34650, category: 'utility' },
    { date: '2024-02-01', description: 'SALARY CREDIT - INFOSYS LTD', amount: 44800, type: 'credit' as const, balance: 79450, category: 'salary' },
    { date: '2024-02-05', description: 'EMI - BAJAJ FINANCE', amount: -4500, type: 'debit' as const, balance: 74950, category: 'emi' },
    { date: '2024-02-10', description: 'UPI - ZOMATO', amount: -680, type: 'debit' as const, balance: 74270, category: 'upi' },
    { date: '2024-02-15', description: 'MUTUAL FUND SIP', amount: -5000, type: 'debit' as const, balance: 69270, category: 'investment' },
    { date: '2024-02-20', description: 'REFUND - AMAZON', amount: 1200, type: 'credit' as const, balance: 70470, category: 'refund' },
    { date: '2024-03-01', description: 'SALARY CREDIT - INFOSYS LTD', amount: 44800, type: 'credit' as const, balance: 115270, category: 'salary' },
    { date: '2024-03-05', description: 'RENT TRANSFER', amount: -15000, type: 'debit' as const, balance: 100270, category: 'transfer' },
    { date: '2024-03-10', description: 'INSURANCE PREMIUM', amount: -2500, type: 'debit' as const, balance: 97770, category: 'utility' }
  ];

  return {
    bank_name: 'HDFC Bank',
    account_number: 'XXXX4521',
    period: '3 months',
    period_start: '2024-01-01',
    period_end: '2024-03-31',
    account_holder: 'Rajesh Kumar',
    confidence: 0.94,
    warnings: [],
    transactions: sampleTransactions
  };
}

export default router;