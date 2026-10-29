import { describe, it, expect, vi, beforeEach } from 'vitest';
import MLPredictionEngine, { LoanPredictionRequest } from '../src/services/ml-prediction-engine';
import * as fs from 'fs';
import * as path from 'path';

// Mock admin database calls if any
vi.mock('firebase-admin', () => {
  return {
    default: {
      firestore: () => ({
        collection: () => ({
          doc: () => ({
            get: async () => ({
              exists: true,
              data: () => ({
                incomeStability: 'high',
                savingsRatio: 25,
                monthlyRecurringIncome: 75000
              })
            })
          })
        })
      })
    }
  };
});

describe('MLPredictionEngine & ML Model Inference', () => {
  const sampleRequest: LoanPredictionRequest = {
    userId: 'user_123',
    applicationId: 'app_456',
    age: 30,
    employmentType: 'salaried',
    monthlyIncome: 80000,
    existingEmi: 15000,
    creditScore: 780,
    accountsActive: 5,
    accountsDelinquent: 0,
    maxDpd: 0,
    inquiries90Days: 1,
    requestedLoanAmount: 200000,
    requestedTenure: 24,
    loanPurpose: 'Debt Consolidation'
  };

  it('should run predictLoanApproval successfully', async () => {
    const result = await MLPredictionEngine.predictLoanApproval(sampleRequest);
    
    // Verify required properties in LoanPredictionResult
    expect(result).toHaveProperty('approvalScore');
    expect(result).toHaveProperty('approvalProbability');
    expect(result).toHaveProperty('riskScore');
    expect(result).toHaveProperty('riskCategory');
    expect(result).toHaveProperty('decision');
    expect(result).toHaveProperty('positiveFactors');
    expect(result).toHaveProperty('negativeFactors');
    expect(result).toHaveProperty('modelVersion');
    
    expect(result.approvalProbability).toBeGreaterThanOrEqual(0.0);
    expect(result.approvalProbability).toBeLessThanOrEqual(1.0);
    expect(result.riskScore).toBeGreaterThanOrEqual(0.0);
    expect(result.riskScore).toBeLessThanOrEqual(100.0);
  });

  it('should reflect model behavior when creditScore is low', async () => {
    const highRiskRequest: LoanPredictionRequest = {
      ...sampleRequest,
      creditScore: 500,
      existingEmi: 65000, // Very high debt
      accountsDelinquent: 2
    };

    const result = await MLPredictionEngine.predictLoanApproval(highRiskRequest);

    // Verify low credit score is caught
    expect(result.decision).toBe('reject');
    expect(result.riskCategory).toBe('high');
    expect(result.approvalProbability).toBeLessThan(0.5);
  });

  it('should accurately calculate EMI values', async () => {
    const result = await MLPredictionEngine.predictLoanApproval(sampleRequest);
    expect(result.estimatedMonthlyEmi).toBeGreaterThan(0);
    expect(result.maxApprovableAmount).toBeGreaterThan(0);
  });
});
