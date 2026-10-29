import pdfParse from 'pdf-parse';
import * as fs from 'fs';
import * as path from 'path';
import admin from 'firebase-admin';

/**
 * Bank Statement Parser Service
 * Extracts financial insights from uploaded bank statements (PDF/Image)
 */

export interface TransactionCategory {
  salary: number; // Monthly recurring income
  emi: number; // EMI/loan obligations
  utilities: number; // Bills, electricity, etc.
  groceries: number; // Food & groceries
  shopping: number; // Retail purchases
  entertainment: number; // Movies, dining out
  transport: number; // Auto, fuel, metro
  investments: number; // Savings, investments
  insurance: number; // Insurance premiums
  healthcare: number; // Medical expenses
  other: number; // Miscellaneous
}

export interface ParsedBankStatement {
  userId: string;
  applicationId: string;
  fileName: string;
  uploadedAt: Date;
  
  // Income Analysis
  monthlyRecurringIncome: number; // Average salary credit
  incomeVariation: number; // Std deviation % (measure of stability)
  avgMonthlyIncome: number; // Last 12 months average
  
  // Expense Analysis
  monthlyRecurringExpenses: number; // Fixed monthly expenses
  avgMonthlyExpense: number; // Total monthly average
  variableExpenses: number; // Discretionary spending
  
  // EMI & Obligations
  existingEmiAmount: number; // Total monthly EMI
  existingLoanCount: number; // Number of active loans
  
  // Financial Health
  savingsRatio: number; // (Income - Expense) / Income percentage
  emiToIncomeRatio: number; // EMI / Income percentage
  
  // Spending Breakdown
  spendingBreakdown: TransactionCategory;
  
  // Trends
  incomeStability: 'high' | 'medium' | 'low'; // Based on variation
  spendingTrend: 'increasing' | 'stable' | 'decreasing';
  savingsTrend: 'improving' | 'stable' | 'deteriorating';
  
  // Red Flags
  redFlags: string[];
  positiveSignals: string[];
  
  // Raw Analysis
  transactionCount: number;
  analysisDataPoints: number; // Months analyzed
  bankName?: string;
  accountType?: string;
  
  // Metadata
  parsedAt: Date;
  confidence: number; // 0-100% confidence in parsing accuracy
}

export interface Transaction {
  date: Date;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category: keyof TransactionCategory;
  runningBalance?: number;
}

class BankStatementParser {
  /**
   * Main entry point: Parse bank statement file
   */
  static async parseStatement(
    filePath: string,
    userId: string,
    applicationId: string
  ): Promise<ParsedBankStatement> {
    try {
      const fileName = path.basename(filePath);
      
      // Extract text from PDF
      let extractedText = '';
      if (fileName.toLowerCase().endsWith('.pdf')) {
        extractedText = await this.extractPdfText(filePath);
      } else {
        // For images, we'd use OCR (Tesseract)
        // For now, return error
        throw new Error('Image parsing requires OCR setup');
      }

      // Parse transactions from text
      const transactions = this.parseTransactions(extractedText);
      
      if (transactions.length === 0) {
        throw new Error('No transactions found in statement');
      }

      // Analyze financial metrics
      const analysis = this.analyzeTransactions(transactions);
      
      // Build result
      const result: ParsedBankStatement = {
        userId,
        applicationId,
        fileName,
        uploadedAt: new Date(),
        
        monthlyRecurringIncome: analysis.monthlyRecurringIncome,
        incomeVariation: analysis.incomeVariation,
        avgMonthlyIncome: analysis.avgMonthlyIncome,
        
        monthlyRecurringExpenses: analysis.monthlyRecurringExpenses,
        avgMonthlyExpense: analysis.avgMonthlyExpense,
        variableExpenses: analysis.variableExpenses,
        
        existingEmiAmount: analysis.existingEmiAmount,
        existingLoanCount: analysis.existingLoanCount,
        
        savingsRatio: analysis.savingsRatio,
        emiToIncomeRatio: analysis.emiToIncomeRatio,
        
        spendingBreakdown: analysis.spendingBreakdown,
        
        incomeStability: analysis.incomeStability,
        spendingTrend: analysis.spendingTrend,
        savingsTrend: analysis.savingsTrend,
        
        redFlags: analysis.redFlags,
        positiveSignals: analysis.positiveSignals,
        
        transactionCount: transactions.length,
        analysisDataPoints: analysis.monthsAnalyzed,
        bankName: analysis.bankName,
        accountType: analysis.accountType,
        
        parsedAt: new Date(),
        confidence: analysis.confidence,
      };

      return result;
    } catch (error) {
      console.error('Bank statement parsing error:', error);
      throw error;
    }
  }

  /**
   * Extract text from PDF file
   */
  private static async extractPdfText(filePath: string): Promise<string> {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const pdfData = await (pdfParse as any)(fileBuffer);
      return pdfData.text;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Parse transactions from extracted text
   */
  private static parseTransactions(text: string): Transaction[] {
    const transactions: Transaction[] = [];
    
    // Common patterns for transaction lines
    // Format: DD/MM/YYYY | Description | Amount | Type
    const patterns = [
      // DD/MM/YYYY | Description | Amount
      /(\d{1,2}[/]\d{1,2}[/]\d{2,4})[^\d]*([A-Za-z0-9\s/.,-]*?)[\s]*([+-]?[\d,]+\.?\d*)/gm,
      // Date | Description | Debit/Credit | Amount
      /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})[^\d]*([A-Za-z0-9\s/.,-]*?)(?:DR|CR|Debit|Credit)?[\s]*([+-]?[\d,]+\.?\d*)/gm,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        try {
          const [, dateStr, description, amountStr] = match;
          const date = this.parseDate(dateStr);
          const amount = parseFloat(amountStr.replace(/,/g, ''));
          const type = amount > 0 ? 'credit' : 'debit';
          const category = this.categorizeTransaction(description);

          transactions.push({
            date,
            description: description.trim(),
            amount: Math.abs(amount),
            type,
            category,
          });
        } catch (e) {
          // Skip invalid transactions
          continue;
        }
      }
    }

    // Remove duplicates and sort by date
    return Array.from(new Map(
      transactions.map(t => [
        `${t.date.getTime()}-${t.amount}-${t.type}`,
        t
      ])
    ).values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Parse date string in multiple formats
   */
  private static parseDate(dateStr: string): Date {
    // Try multiple date formats
    const formats = [
      /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/,
      /(\d{4})[/-](\d{1,2})[/-](\d{1,2})/,
    ];

    for (const format of formats) {
      const match = format.exec(dateStr);
      if (match) {
        const [, p1, p2, p3] = match;
        let year = parseInt(p3);
        let month = parseInt(p2);
        let day = parseInt(p1);

        // Detect format
        if (year > 1000) {
          // YYYY-MM-DD or YYYY-DD-MM
          if (month > 12) [month, day] = [day, month];
        } else {
          // DD/MM/YY or MM/DD/YY
          year = year < 100 ? 2000 + year : year;
          if (month > 12) [month, day] = [day, month]; // Correct if swapped
        }

        return new Date(year, month - 1, day);
      }
    }

    throw new Error(`Cannot parse date: ${dateStr}`);
  }

  /**
   * Categorize transaction based on description
   */
  private static categorizeTransaction(description: string): keyof TransactionCategory {
    const desc = description.toLowerCase();

    const categories: Record<string, RegExp[]> = {
      salary: [/salary|payroll|compensation|bonus|commission/i],
      emi: [/emi|loan|repayment|credit card|installment/i],
      utilities: [/electricity|water|gas|phone|broadband|bills/i],
      groceries: [/grocery|supermarket|walmart|reliance|big basket|amazon fresh/i],
      shopping: [/amazon|flipkart|myntra|mall|retail|store|purchase/i],
      entertainment: [/movies|cinema|netflix|spotify|amazon prime|dining|restaurant|cafe/i],
      transport: [/fuel|petrol|diesel|metro|bus|taxi|uber|auto|transport/i],
      investments: [/savings|investment|mutual fund|stock|sip|ppf|fd/i],
      insurance: [/insurance|premium|policy|claim/i],
      healthcare: [/hospital|medical|doctor|pharmacy|health|clinic/i],
      other: [/.*/],
    };

    for (const [category, patterns] of Object.entries(categories)) {
      for (const pattern of patterns) {
        if (pattern.test(desc)) {
          return category as keyof TransactionCategory;
        }
      }
    }

    return 'other';
  }

  /**
   * Analyze transactions and extract insights
   */
  private static analyzeTransactions(transactions: Transaction[]) {
    const creditTransactions = transactions.filter(t => t.type === 'credit');
    const debitTransactions = transactions.filter(t => t.type === 'debit');

    // Group by month
    const transactionsByMonth = new Map<string, Transaction[]>();
    transactions.forEach(t => {
      const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      if (!transactionsByMonth.has(key)) {
        transactionsByMonth.set(key, []);
      }
      transactionsByMonth.get(key)!.push(t);
    });

    const monthsAnalyzed = transactionsByMonth.size;

    // Calculate income metrics
    const salaryTransactions = creditTransactions.filter(t => t.category === 'salary');
    const avgMonthlyIncome = creditTransactions.reduce((s, t) => s + t.amount, 0) / Math.max(monthsAnalyzed, 1);
    const monthlyRecurringIncome = salaryTransactions.length > 0
      ? salaryTransactions.reduce((s, t) => s + t.amount, 0) / Math.max(salaryTransactions.length / monthsAnalyzed, 1)
      : 0;

    // Income variation (coefficient of variation)
    const incomesPerMonth = Array.from(transactionsByMonth.values()).map(
      m => m.filter(t => t.category === 'salary').reduce((s, t) => s + t.amount, 0)
    );
    const incomeVariation = this.calculateVariation(incomesPerMonth);

    // EMI Analysis
    const emiTransactions = debitTransactions.filter(t => t.category === 'emi');
    const existingEmiAmount = emiTransactions.length > 0
      ? emiTransactions.reduce((s, t) => s + t.amount, 0) / Math.max(emiTransactions.length / monthsAnalyzed, 1)
      : 0;
    const existingLoanCount = new Set(emiTransactions.map(t => t.description)).size;

    // Expense Analysis
    const avgMonthlyExpense = debitTransactions.reduce((s, t) => s + t.amount, 0) / Math.max(monthsAnalyzed, 1);
    const monthlyRecurringExpenses = debitTransactions
      .filter(t => ['utilities', 'insurance', 'emi'].includes(t.category))
      .reduce((s, t) => s + t.amount, 0) / Math.max(monthsAnalyzed, 1);

    const variableExpenses = avgMonthlyExpense - monthlyRecurringExpenses;

    // Financial Health Ratios
    const savingsRatio = monthlyRecurringIncome > 0
      ? ((monthlyRecurringIncome - avgMonthlyExpense) / monthlyRecurringIncome) * 100
      : 0;

    const emiToIncomeRatio = monthlyRecurringIncome > 0
      ? (existingEmiAmount / monthlyRecurringIncome) * 100
      : 0;

    // Spending Breakdown
    const spendingBreakdown: TransactionCategory = {
      salary: 0,
      emi: 0,
      utilities: 0,
      groceries: 0,
      shopping: 0,
      entertainment: 0,
      transport: 0,
      investments: 0,
      insurance: 0,
      healthcare: 0,
      other: 0,
    };

    debitTransactions.forEach(t => {
      spendingBreakdown[t.category] += t.amount;
    });

    // Normalize to monthly average
    Object.keys(spendingBreakdown).forEach(key => {
      spendingBreakdown[key as keyof TransactionCategory] /= Math.max(monthsAnalyzed, 1);
    });

    // Trends
    const incomeStability = incomeVariation < 15 ? 'high' : incomeVariation < 30 ? 'medium' : 'low';
    
    const recentMonthsExpense = Array.from(transactionsByMonth.values())
      .slice(-3)
      .map(m => m.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0));
    const spendingTrend = recentMonthsExpense[2] < recentMonthsExpense[0]
      ? 'decreasing'
      : recentMonthsExpense[2] > recentMonthsExpense[0]
      ? 'increasing'
      : 'stable';

    const recentMonthsSavings = Array.from(transactionsByMonth.values())
      .slice(-3)
      .map(m => {
        const income = m.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
        const expense = m.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
        return income - expense;
      });
    const savingsTrend = recentMonthsSavings[2] > recentMonthsSavings[0]
      ? 'improving'
      : recentMonthsSavings[2] < recentMonthsSavings[0]
      ? 'deteriorating'
      : 'stable';

    // Red Flags
    const redFlags: string[] = [];
    if (savingsRatio < 5) redFlags.push('Very low savings ratio');
    if (emiToIncomeRatio > 50) redFlags.push('High EMI burden');
    if (incomeVariation > 40) redFlags.push('Unstable income');
    if (spendingTrend === 'increasing' && savingsTrend === 'deteriorating') {
      redFlags.push('Deteriorating financial health');
    }
    if (existingLoanCount > 5) redFlags.push('Multiple active loans');

    // Positive Signals
    const positiveSignals: string[] = [];
    if (savingsRatio > 25) positiveSignals.push('Excellent savings rate');
    if (emiToIncomeRatio < 20) positiveSignals.push('Low EMI burden');
    if (incomeStability === 'high') positiveSignals.push('Stable income');
    if (spendingTrend === 'decreasing') positiveSignals.push('Controlled spending');
    if (savingsTrend === 'improving') positiveSignals.push('Improving financial health');

    return {
      monthlyRecurringIncome,
      incomeVariation,
      avgMonthlyIncome,
      monthlyRecurringExpenses,
      avgMonthlyExpense,
      variableExpenses,
      existingEmiAmount,
      existingLoanCount,
      savingsRatio,
      emiToIncomeRatio,
      spendingBreakdown,
      incomeStability: incomeStability as 'high' | 'medium' | 'low',
      spendingTrend: spendingTrend as 'increasing' | 'stable' | 'decreasing',
      savingsTrend: savingsTrend as 'improving' | 'stable' | 'deteriorating',
      redFlags,
      positiveSignals,
      monthsAnalyzed,
      bankName: 'Unknown', // Would need to parse from statement
      accountType: 'Savings', // Would need to parse from statement
      confidence: Math.min(100, Math.max(50, 50 + transactions.length * 10)), // Rough estimate
    };
  }

  /**
   * Calculate coefficient of variation (%)
   */
  private static calculateVariation(values: number[]): number {
    if (values.length === 0 || values.every(v => v === 0)) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return mean > 0 ? (stdDev / mean) * 100 : 0;
  }

  /**
   * Save parsed statement to Firestore
   */
  static async saveToFirestore(
    statement: ParsedBankStatement,
    db: admin.firestore.Firestore
  ): Promise<string> {
    try {
      const docRef = await db.collection('bankStatementAnalysis').add({
        ...statement,
        uploadedAt: admin.firestore.Timestamp.fromDate(statement.uploadedAt),
        parsedAt: admin.firestore.Timestamp.fromDate(statement.parsedAt),
      });

      // Update application with parsed statement reference
      await db.collection('applications').doc(statement.applicationId).update({
        bankStatementAnalysisId: docRef.id,
        bankStatementParsedAt: admin.firestore.Timestamp.now(),
      });

      return docRef.id;
    } catch (error) {
      console.error('Failed to save to Firestore:', error);
      throw error;
    }
  }
}

export default BankStatementParser;
