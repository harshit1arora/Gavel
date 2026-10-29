import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import {
  CheckCircle, AlertTriangle, TrendingUp, DollarSign, Clock, AlertCircle, Lightbulb,
} from 'lucide-react';
import { LoanPredictionResult } from '@/types/loan-prediction';

interface PredictionResultProps {
  prediction: LoanPredictionResult;
  loanAmount: number;
  onApply?: () => void;
}

const PredictionResult: React.FC<PredictionResultProps> = ({ prediction, loanAmount, onApply }) => {
  const [explanations, setExplanations] = useState<any[]>([]);
  const [loadingExplanations, setLoadingExplanations] = useState(false);
  const [showExplanations, setShowExplanations] = useState(false);

  useEffect(() => {
    if (prediction.applicationId && !prediction.applicationId.startsWith('form-')) {
      setLoadingExplanations(true);
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      fetch(`${API_BASE}/api/loan/${prediction.applicationId}/explanation`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch explanations');
          return res.json();
        })
        .then(data => {
          if (data && data.explanations) {
            setExplanations(data.explanations);
          }
        })
        .catch(err => {
          console.warn('Could not fetch explanations, falling back to local extraction:', err);
          generateLocalExplanations();
        })
        .finally(() => {
          setLoadingExplanations(false);
        });
    } else {
      generateLocalExplanations();
    }

    function generateLocalExplanations() {
      const positive = prediction.positiveFactors || [];
      const negative = prediction.negativeFactors || [];
      const localExps: any[] = [];
      const isApproved = prediction.decision === 'approve';

      const friendlyReasons: Record<string, string> = {
        'Excellent credit score': 'Excellent credit score significantly lowered loan default risk.',
        'Stable income sources': 'Stable income source verified from bank statement records.',
        'Stable, salaried income': 'Stable income source verified from bank statement records.',
        'Good EMI capacity': 'Optimal income-to-EMI headroom indicates comfortable repayment ability.',
        'Healthy savings ratio': 'Consistent monthly savings ratio demonstrates strong financial discipline.',
        'Good savings ratio': 'Consistent monthly savings ratio demonstrates strong financial discipline.',
        'Consistent repayment history': 'Excellent repayment history verified on bureau database.',
        'Optimal age profile': 'Age profile is within prime working and repayment demographic.',
        'Stable employment status': 'Employment status matches high-repayment category.',
        'High existing debt burden': 'High existing debt burden reduces monthly repayment capacity.',
        'Elevated Debt-to-Income ratio': 'High existing debt burden reduces monthly repayment capacity.',
        'Low credit score': 'Sub-optimal credit history indicates higher default risk.',
        'Unstable income': 'Volatile monthly cash flows indicate potential payment risk.',
        'Limited EMI capacity': 'Existing obligations leave narrow headroom for servicing new EMIs.',
        'Low savings ratio': 'Low savings buffer increases vulnerability to missing payments.',
        'Credit history parameters within bounds': 'Baseline credit parameters meet policy guidelines.',
        'Existing obligation constraints': 'Debt obligations are at the standard policy limit.'
      };

      const mapFactor = (factor: string, impact: 'positive' | 'risk') => {
        let cleanFactor = factor;
        if (factor.startsWith('Sub-optimal')) {
          cleanFactor = 'Low credit score';
        }
        return {
          factor: cleanFactor,
          impact,
          direction: impact === 'positive' ? 'down' : 'up',
          reason: friendlyReasons[cleanFactor] || `${factor} was a key driver in the loan decision.`
        };
      };

      if (isApproved) {
        positive.forEach(f => localExps.push(mapFactor(f, 'positive')));
        negative.forEach(f => localExps.push(mapFactor(f, 'risk')));
      } else {
        negative.forEach(f => localExps.push(mapFactor(f, 'risk')));
        positive.forEach(f => localExps.push(mapFactor(f, 'positive')));
      }

      setExplanations(localExps.slice(0, 3));
    }
  }, [prediction.applicationId, prediction.positiveFactors, prediction.negativeFactors]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Color based on decision
  const decisionColor = {
    approve: 'bg-green-50 border-green-200',
    conditional: 'bg-yellow-50 border-yellow-200',
    reject: 'bg-red-50 border-red-200',
  };

  const decisionIcon = {
    approve: <CheckCircle className="h-6 w-6 text-green-600" />,
    conditional: <AlertCircle className="h-6 w-6 text-yellow-600" />,
    reject: <AlertTriangle className="h-6 w-6 text-red-600" />,
  };

  const decisionTextColor = {
    approve: 'text-green-800',
    conditional: 'text-yellow-800',
    reject: 'text-red-800',
  };

  // Eligibility score breakdown data
  const radarData = [
    { factor: 'Credit Score', value: Math.min(100, (prediction.approvalScore * 30) / 100) },
    { factor: 'Income Stability', value: prediction.incomeStability === 'high' ? 100 : prediction.incomeStability === 'medium' ? 60 : 30 },
    { factor: 'EMI Capacity', value: Math.min(100, prediction.emiCapacity * 5) },
    { factor: 'Debt Ratio', value: Math.max(0, 100 - prediction.debtToIncomeRatio * 2) },
    { factor: 'Risk Profile', value: Math.max(0, 100 - prediction.riskScore) },
  ];

  // Estimated repayment timeline
  const tenor = 60; // months
  const monthlyEmi = prediction.estimatedMonthlyEmi;
  const timelineData = Array.from({ length: Math.min(12, tenor) }, (_, i) => ({
    month: `M${i + 1}`,
    emi: monthlyEmi,
    principal: (monthlyEmi * 0.3) + (i * monthlyEmi * 0.01), // Simplified
    interest: (monthlyEmi * 0.7) - (i * monthlyEmi * 0.01),
  }));

  return (
    <div className="space-y-6">
      {/* Main Decision Card */}
      <div className={`border rounded-lg p-6 ${decisionColor[prediction.decision]}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {decisionIcon[prediction.decision]}
            <div>
              <h2 className={`text-2xl font-bold capitalize ${decisionTextColor[prediction.decision]}`}>
                {prediction.decision === 'approve' && 'Pre-Approved! ✨'}
                {prediction.decision === 'conditional' && 'Under Review'}
                {prediction.decision === 'reject' && 'Not Approved'}
              </h2>
              <p className={`text-sm ${decisionTextColor[prediction.decision]}`}>
                {prediction.decisionReason}
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge className="mb-2">{prediction.riskCategory.toUpperCase()} RISK</Badge>
            <div className="text-2xl font-bold">{prediction.approvalScore}/100</div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-current border-opacity-20">
          <div>
            <div className="text-xs opacity-70 mb-1">Max Approvable</div>
            <div className="font-bold">{formatCurrency(prediction.maxApprovableAmount)}</div>
          </div>
          <div>
            <div className="text-xs opacity-70 mb-1">Monthly EMI</div>
            <div className="font-bold">{formatCurrency(prediction.estimatedMonthlyEmi)}</div>
          </div>
          <div>
            <div className="text-xs opacity-70 mb-1">Confidence</div>
            <div className="font-bold">{prediction.confidence}%</div>
          </div>
        </div>
      </div>

      {/* Decision Explanations Panel */}
      {explanations.length > 0 && (
        <div className="border border-zinc-800 rounded-lg bg-zinc-950 overflow-hidden shadow-md">
          <button
            onClick={() => setShowExplanations(!showExplanations)}
            className="w-full flex items-center justify-between p-4 text-left font-medium hover:bg-zinc-900 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <span className="text-zinc-100 text-sm font-semibold">Why was this decision made? (Model Explainability)</span>
            </div>
            <span className="text-zinc-400 text-xs">{showExplanations ? 'Hide details' : 'Show details'}</span>
          </button>
          
          {showExplanations && (
            <div className="p-4 border-t border-zinc-900 bg-zinc-950/80 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {explanations.map((exp, i) => (
                  <div 
                    key={i} 
                    className={`border rounded p-3 text-xs flex flex-col justify-between ${
                      exp.impact === 'positive' 
                        ? 'border-emerald-900/50 bg-emerald-950/10 text-emerald-200' 
                        : 'border-rose-900/50 bg-rose-950/10 text-rose-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-bold text-zinc-100">{exp.factor}</span>
                        {exp.direction === 'up' ? (
                          <TrendingUp className="h-3.5 w-3.5 text-rose-400 flex-shrink-0" />
                        ) : (
                          <span className="text-emerald-400 font-bold flex-shrink-0">↓</span>
                        )}
                      </div>
                      <p className="text-zinc-400 text-[11px] leading-relaxed mb-3">{exp.reason}</p>
                    </div>
                    <div className={`text-[9px] uppercase font-semibold tracking-wider ${
                      exp.impact === 'positive' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {exp.impact === 'positive' ? 'Decreases Default Risk' : 'Increases Default Risk'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs for Detailed Analysis */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="factors">Factors</TabsTrigger>
          <TabsTrigger value="repayment">Repayment</TabsTrigger>
          <TabsTrigger value="advice">Advice</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Eligibility Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="factor" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Score" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-xs text-gray-500 mb-1">Approval Probability</div>
                <div className="text-2xl font-bold mb-2">{Math.round(prediction.approvalProbability * 100)}%</div>
                <Progress value={prediction.approvalProbability * 100} className="h-1" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="text-xs text-gray-500 mb-1">EMI Capacity</div>
                <div className="text-2xl font-bold mb-2">{prediction.emiCapacity}%</div>
                <Progress value={Math.min(100, prediction.emiCapacity * 5)} className="h-1" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="text-xs text-gray-500 mb-1">Debt to Income</div>
                <div className="text-2xl font-bold mb-2">{prediction.debtToIncomeRatio}%</div>
                <Progress value={Math.min(100, prediction.debtToIncomeRatio)} className="h-1" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="text-xs text-gray-500 mb-1">Income Stability</div>
                <Badge variant="secondary" className="capitalize mt-2">
                  {prediction.incomeStability}
                </Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Factors Tab */}
        <TabsContent value="factors" className="space-y-4">
          {/* Positive Factors */}
          {prediction.positiveFactors.length > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-base text-green-900 flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Positive Factors</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {prediction.positiveFactors.map((factor, i) => (
                    <li key={i} className="text-sm text-green-900 flex items-start space-x-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Negative Factors */}
          {prediction.negativeFactors.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-base text-red-900 flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Areas of Concern</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {prediction.negativeFactors.map((factor, i) => (
                    <li key={i} className="text-sm text-red-900 flex items-start space-x-2">
                      <span className="text-red-600 mt-1">!</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Repayment Tab */}
        <TabsContent value="repayment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estimated Repayment Schedule (First 12 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar dataKey="principal" stackId="a" fill="#3b82f6" name="Principal" />
                  <Bar dataKey="interest" stackId="a" fill="#f59e0b" name="Interest" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Loan Amount</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(Math.min(loanAmount, prediction.maxApprovableAmount))}</div>
                <p className="text-xs text-gray-500 mt-1">Requested: {formatCurrency(loanAmount)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Tenure</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{prediction.recommendedTenure} months</div>
                <p className="text-xs text-gray-500 mt-1">{Math.round(prediction.recommendedTenure / 12)} years</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Monthly EMI</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(prediction.estimatedMonthlyEmi)}</div>
                <p className="text-xs text-gray-500 mt-1">Fixed amount</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Advice Tab */}
        <TabsContent value="advice" className="space-y-4">
          {prediction.recommendations.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-base text-blue-900 flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5" />
                  <span>Recommendations to Improve Approval</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {prediction.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-blue-900 flex items-start space-x-3">
                      <span className="font-bold text-blue-600 flex-shrink-0">{i + 1}.</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/* What's Next */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              {prediction.decision === 'approve' && (
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2 text-sm">
                    <span className="text-green-600">✓</span>
                    <span>You're pre-approved! Proceed with application.</span>
                  </li>
                  <li className="flex items-center space-x-2 text-sm">
                    <span className="text-green-600">✓</span>
                    <span>Upload required documents for verification.</span>
                  </li>
                  <li className="flex items-center space-x-2 text-sm">
                    <span className="text-green-600">✓</span>
                    <span>Get funds within 24 hours of approval.</span>
                  </li>
                </ul>
              )}
              {prediction.decision === 'conditional' && (
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2 text-sm">
                    <span className="text-yellow-600">→</span>
                    <span>Complete KYC verification for faster processing.</span>
                  </li>
                  <li className="flex items-center space-x-2 text-sm">
                    <span className="text-yellow-600">→</span>
                    <span>Consider a lower loan amount or longer tenure.</span>
                  </li>
                  <li className="flex items-center space-x-2 text-sm">
                    <span className="text-yellow-600">→</span>
                    <span>Add additional documents for better assessment.</span>
                  </li>
                </ul>
              )}
              {prediction.decision === 'reject' && (
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2 text-sm">
                    <span className="text-red-600">•</span>
                    <span>Reapply after addressing concerns listed above.</span>
                  </li>
                  <li className="flex items-center space-x-2 text-sm">
                    <span className="text-red-600">•</span>
                    <span>Improve credit score and reduce debt burden.</span>
                  </li>
                  <li className="flex items-center space-x-2 text-sm">
                    <span className="text-red-600">•</span>
                    <span>Consider applying again in 3-6 months.</span>
                  </li>
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      {prediction.decision !== 'reject' && (
        <div className="flex gap-3 pt-4">
          <Button onClick={onApply} className="flex-1" size="lg">
            {prediction.decision === 'approve' ? 'Proceed to Apply' : 'Continue Application'}
          </Button>
          <Button variant="outline" size="lg" className="flex-1">
            Save This Result
          </Button>
        </div>
      )}
    </div>
  );
};

export default PredictionResult;
