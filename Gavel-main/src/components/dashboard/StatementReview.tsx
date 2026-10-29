import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, AlertTriangle, CheckCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { originationApi } from '@/lib/api-client';
import { ParsedBankStatement } from '@/types/bank-statement';

interface StatementReviewProps {
  applicationId: string;
  onComplete?: (statement: ParsedBankStatement) => void;
}

const StatementReview: React.FC<StatementReviewProps> = ({ applicationId, onComplete }) => {
  const [statement, setStatement] = useState<ParsedBankStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatement = async () => {
      try {
        setLoading(true);
        const response = await originationApi.getStatementAnalysis(applicationId);
        setStatement(response);
        if (onComplete) {
          onComplete(response);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load statement');
      } finally {
        setLoading(false);
      }
    };

    fetchStatement();
  }, [applicationId, onComplete]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Analyzing your bank statement...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !statement) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error || 'Unable to load statement analysis'}</AlertDescription>
      </Alert>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Bank Statement Analysis</CardTitle>
              <CardDescription className="text-xs text-gray-500">
                {statement.fileName} • {new Date(statement.uploadedAt).toLocaleDateString()}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="ml-2">
              {statement.confidence}% confidence
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Income & Expense Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statement.monthlyRecurringIncome)}</div>
            <p className="text-xs text-gray-500 mt-1">
              Average: {formatCurrency(statement.avgMonthlyIncome)}
            </p>
            <Badge className="mt-2" variant={statement.incomeStability === 'high' ? 'default' : statement.incomeStability === 'medium' ? 'secondary' : 'destructive'}>
              {statement.incomeStability} stability
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Monthly Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statement.avgMonthlyExpense)}</div>
            <p className="text-xs text-gray-500 mt-1">
              Fixed: {formatCurrency(statement.monthlyRecurringExpenses)}
            </p>
            <div className="mt-2 text-xs">
              Variable: {formatCurrency(statement.variableExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Existing EMI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statement.existingEmiAmount)}</div>
            <p className="text-xs text-gray-500 mt-1">
              {statement.existingLoanCount} active loans
            </p>
            <div className="mt-2 text-xs">
              EMI Ratio: {formatPercentage(statement.emiToIncomeRatio)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Health Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Financial Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Savings Ratio</span>
              <span className="text-sm font-bold">{formatPercentage(statement.savingsRatio)}</span>
            </div>
            <Progress 
              value={Math.min(100, statement.savingsRatio * 4)} 
              className="h-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              {statement.savingsRatio < 5 && 'Very low savings capacity'}
              {statement.savingsRatio >= 5 && statement.savingsRatio < 15 && 'Limited savings capacity'}
              {statement.savingsRatio >= 15 && statement.savingsRatio < 25 && 'Good savings capacity'}
              {statement.savingsRatio >= 25 && 'Excellent savings capacity'}
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">EMI to Income Ratio</span>
              <span className="text-sm font-bold">{formatPercentage(statement.emiToIncomeRatio)}</span>
            </div>
            <Progress 
              value={Math.min(100, statement.emiToIncomeRatio)} 
              className="h-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              {statement.emiToIncomeRatio > 50 && 'High EMI burden - may limit new borrowing'}
              {statement.emiToIncomeRatio <= 50 && statement.emiToIncomeRatio > 30 && 'Moderate EMI burden'}
              {statement.emiToIncomeRatio <= 30 && 'Healthy EMI to income ratio'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Spending Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Spending Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(statement.spendingBreakdown)
              .filter(([_, amount]) => amount > 0)
              .sort(([_a], [_b]) => 
                (statement.spendingBreakdown[_b as keyof typeof statement.spendingBreakdown] || 0) - 
                (statement.spendingBreakdown[_a as keyof typeof statement.spendingBreakdown] || 0)
              )
              .map(([category, amount]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{category}</span>
                  <span className="text-sm font-medium">{formatCurrency(amount)}</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Trends */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {statement.spendingTrend === 'decreasing' ? (
                <TrendingDown className="h-5 w-5 text-green-600" />
              ) : statement.spendingTrend === 'increasing' ? (
                <TrendingUp className="h-5 w-5 text-red-600" />
              ) : (
                <div className="h-5 w-5 text-gray-400">─</div>
              )}
              <span className="font-medium capitalize">{statement.spendingTrend}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Savings Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {statement.savingsTrend === 'improving' ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : statement.savingsTrend === 'deteriorating' ? (
                <TrendingDown className="h-5 w-5 text-red-600" />
              ) : (
                <div className="h-5 w-5 text-gray-400">─</div>
              )}
              <span className="font-medium capitalize">{statement.savingsTrend}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Income Stability</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={statement.incomeStability === 'high' ? 'default' : statement.incomeStability === 'medium' ? 'secondary' : 'destructive'} className="capitalize">
              {statement.incomeStability}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Red Flags */}
      {statement.redFlags.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Red Flags</div>
            <ul className="list-disc list-inside space-y-1">
              {statement.redFlags.map((flag, i) => (
                <li key={i} className="text-sm">{flag}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Positive Signals */}
      {statement.positiveSignals.length > 0 && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="font-medium mb-2">Positive Signals</div>
            <ul className="list-disc list-inside space-y-1">
              {statement.positiveSignals.map((signal, i) => (
                <li key={i} className="text-sm">{signal}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Analysis Metadata */}
      <Card className="bg-gray-50">
        <CardContent className="pt-4 text-xs text-gray-600">
          <div className="grid grid-cols-2 gap-2">
            <div>Transactions analyzed: {statement.transactionCount}</div>
            <div>Months covered: {statement.analysisDataPoints}</div>
            <div>Bank: {statement.bankName || 'Unknown'}</div>
            <div>Account type: {statement.accountType || 'Savings'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatementReview;
