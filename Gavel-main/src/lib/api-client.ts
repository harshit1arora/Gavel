import { auth } from './firebase';

/**
 * Centralized API client for Gavel backend.
 * - Uses environment variable for base URL (no hardcoded localhost)
 * - Automatically attaches Firebase ID Token for authenticated requests
 * - Handles error responses consistently
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * Get the current user's Firebase ID Token for backend authentication.
 * Returns null if user is not authenticated.
 */
const getIdToken = async (): Promise<string | null> => {
  if (auth.currentUser) {
    return auth.currentUser.getIdToken();
  }
  return null;
};

/**
 * Make an authenticated API request using the user's Firebase ID Token.
 * Used for dashboard/console operations (key generation, config, etc.)
 */
export const apiWithAuth = async (path: string, options: RequestInit = {}): Promise<Response> => {
  const token = await getIdToken();
  if (!token) {
    throw new Error('Not authenticated. Please sign in.');
  }

  const defaultHeaders: any = {
    'Authorization': `Bearer ${token}`
  };
  
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });
};

/**
 * Make an API request using an API key.
 * Used for programmatic/SDK-style operations.
 */
export const apiWithKey = async (path: string, apiKey: string, options: RequestInit = {}): Promise<Response> => {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...options.headers,
    },
  });
};

/**
 * Parse API response with error handling.
 */
export const parseResponse = async <T = any>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API Error: ${response.status}`);
  }
  return response.json();
};

// ==================== Collections API ====================

export const collectionsApi = {
  getDashboard: () => apiWithAuth('/v1/collections/dashboard'),
  getPipeline: () => apiWithAuth('/v1/collections/pipeline'),
  getMetrics: () => apiWithAuth('/v1/collections/metrics'),
  getOverdueLoans: (params?: { page?: number; limit?: number }) => 
    apiWithAuth(`/v1/collections/overdue?page=${params?.page || 1}&limit=${params?.limit || 20}`),
  createPromise: (loanId: string, data: { amount: number; date: string; notes?: string }) =>
    apiWithAuth('/v1/collections/promise', { method: 'POST', body: JSON.stringify({ loanId, ...data }) }),
  markAsResolved: (loanId: string, resolution: string) =>
    apiWithAuth('/v1/collections/resolve', { method: 'POST', body: JSON.stringify({ loanId, resolution }) }),
  sendReminder: (loanId: string) =>
    apiWithAuth(`/v1/collections/remind/${loanId}`, { method: 'POST' }),
  getAgentWorkload: () => apiWithAuth('/v1/collections/agent-workload'),
  triggerWorkflow: (loanId: string, missedEmis: number, daysOverdue: number) =>
    apiWithAuth('/v1/collections/trigger/' + loanId, { method: 'POST', body: JSON.stringify({ missedEmis, daysOverdue }) }),
  processAllOverdue: () =>
    apiWithAuth('/v1/collections/process-all', { method: 'POST' }),
  getWorkflowStatus: (loanId: string) =>
    apiWithAuth('/v1/collections/workflow/' + loanId),
};

// ==================== Loan Origination API ====================

export const originationApi = {
  getApplications: (params?: { status?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiWithAuth(`/v1/origination/applications?${query}`);
  },
  getApplication: (id: string) => apiWithAuth(`/v1/origination/applications/${id}`),
  createApplication: (data: any) => apiWithAuth('/v1/origination/applications', { method: 'POST', body: JSON.stringify(data) }),
  updateApplication: (id: string, data: any) => apiWithAuth(`/v1/origination/applications/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  bulkUpload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiWithAuth('/v1/origination/bulk-upload', { method: 'POST', body: formData });
  },
  startKYC: (applicationId: string, data: { aadhaar?: string; pan?: string }) =>
    apiWithAuth(`/v1/origination/applications/${applicationId}/kyc`, { method: 'POST', body: JSON.stringify(data) }),
  /**
   * Parsed bank statement attached to an application.
   * Backed by GET /v1/statement-analysis/:applicationId.
   */
  getStatementAnalysis: async (applicationId: string) => {
    const res = await apiWithAuth(`/v1/statement-analysis/${applicationId}`);
    if (!res.ok) throw new Error(`Statement analysis unavailable (${res.status})`);
    return res.json();
  },
};

// ==================== Compliance API ====================

export const complianceApi = {
  getAuditTrail: (params?: { startDate?: string; endDate?: string; action?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiWithAuth(`/v1/compliance/audit-trail?${query}`);
  },
  getReports: () => apiWithAuth('/v1/compliance/reports'),
  generateReport: (type: string, params: any) =>
    apiWithAuth('/v1/compliance/generate', { method: 'POST', body: JSON.stringify({ type, ...params }) }),
  getStatistics: () => apiWithAuth('/v1/compliance/statistics'),
};

// ==================== Agent Commission API ====================

export const agentsApi = {
  getAgents: (params?: { tier?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiWithAuth(`/v1/agents?${query}`);
  },
  getAgent: (id: string) => apiWithAuth(`/v1/agents/${id}`),
  getCommission: (agentId: string, params?: { month?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiWithAuth(`/v1/agents/${agentId}/commission?${query}`);
  },
  getPayoutSchedule: (agentId: string) => apiWithAuth(`/v1/agents/${agentId}/payouts`),
  updateAgent: (id: string, data: any) => apiWithAuth(`/v1/agents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// ==================== Portfolio API ====================

export const portfolioApi = {
  getOverview: () => apiWithAuth('/v1/portfolio/overview'),
  getAUM: () => apiWithAuth('/v1/portfolio/aum'),
  getSegmentation: () => apiWithAuth('/v1/portfolio/segmentation'),
  getTrends: (params?: { period?: string }) =>
    apiWithAuth(`/v1/portfolio/trends?period=${params?.period || '30d'}`),
  getPerformance: (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiWithAuth(`/v1/portfolio/performance?${query}`);
  },
};

// ==================== Payment API ====================

export const paymentApi = {
  getPaymentLink: (loanId: string, amount: number, description?: string) =>
    apiWithAuth('/v1/payments/link', { method: 'POST', body: JSON.stringify({ loanId, amount, description }) }),
  getPaymentStatus: (paymentId: string) => apiWithAuth(`/v1/payments/${paymentId}`),
  recordPayment: (data: { loanId: string; amount: number; method: string; reference?: string }) =>
    apiWithAuth('/v1/payments/record', { method: 'POST', body: JSON.stringify(data) }),
  initiateRefund: (paymentId: string, amount: number, reason: string) =>
    apiWithAuth('/v1/payments/refund', { method: 'POST', body: JSON.stringify({ paymentId, amount, reason }) }),
};

// ==================== AI Evaluation API ====================

export const aiApi = {
  evaluate: (applicationData: any) => apiWithAuth('/v1/ai/evaluate', { method: 'POST', body: JSON.stringify(applicationData) }),
  analyzeBankStatement: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiWithAuth('/v1/ai/analyze-bank-statement', { method: 'POST', body: formData });
  },
  generateAgreement: (loanId: string) => apiWithAuth('/v1/ai/generate-agreement', { method: 'POST', body: JSON.stringify({ loanId }) }),
  chat: (message: string, context?: any) => apiWithAuth('/v1/ai/chat', { method: 'POST', body: JSON.stringify({ message, context }) }),
  getStatus: () => apiWithAuth('/v1/ai/status'),
};

// ==================== Workflow API ====================

export const workflowApi = {
  start: (applicationId: string, workflowType: string = 'standard') =>
    apiWithAuth('/v1/workflow/start', { method: 'POST', body: JSON.stringify({ applicationId, workflowType }) }),
  get: (workflowId: string) => apiWithAuth(`/v1/workflow/${workflowId}`),
  getByApplication: (applicationId: string) => apiWithAuth(`/v1/workflow/by-application/${applicationId}`),
  getAnalytics: () => apiWithAuth('/v1/workflow/analytics/summary'),
};

// ==================== KYC API ====================

export const kycApi = {
  verifyAadhaar: (aadhaarNumber: string, name?: string, dob?: string) =>
    apiWithAuth('/v1/kyc/aadhaar/verify', { method: 'POST', body: JSON.stringify({ aadhaarNumber, name, dob }) }),
  getEKYC: (aadhaarNumber: string) => apiWithAuth('/v1/kyc/aadhaar/ekyc', { method: 'POST', body: JSON.stringify({ aadhaarNumber }) }),
  verifyPAN: (panNumber: string, name?: string, dob?: string) =>
    apiWithAuth('/v1/kyc/pan/verify', { method: 'POST', body: JSON.stringify({ panNumber, name, dob }) }),
  verifyAll: (aadhaarNumber?: string, panNumber?: string) =>
    apiWithAuth('/v1/kyc/verify-all', { method: 'POST', body: JSON.stringify({ aadhaarNumber, panNumber }) }),
  batchVerify: (applicants: { id: string; aadhaar?: string; pan?: string }[]) =>
    apiWithAuth('/v1/kyc/batch-verify', { method: 'POST', body: JSON.stringify({ applicants }) }),
  getStatus: (applicationId: string) => apiWithAuth(`/v1/kyc/status/${applicationId}`),
};

// ==================== Disbursement API ====================

export const disbursementApi = {
  initiate: (data: { loanId: string; bankAccountNumber: string; ifscCode: string; beneficiaryName: string; amount: number; paymentMode?: string }) =>
    apiWithAuth('/v1/disbursement/initiate', { method: 'POST', body: JSON.stringify(data) }),
  getStatus: (transactionId: string) => apiWithAuth(`/v1/disbursement/status/${transactionId}`),
  list: (params?: { status?: string; fromDate?: string; toDate?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiWithAuth(`/v1/disbursement?${query}`);
  },
  bulk: (disbursements: any[]) => apiWithAuth('/v1/disbursement/bulk', { method: 'POST', body: JSON.stringify({ disbursements }) }),
  reverse: (transactionId: string) => apiWithAuth(`/v1/disbursement/${transactionId}/reverse`, { method: 'POST' }),
  getAnalytics: () => apiWithAuth('/v1/disbursement/analytics/summary'),
};

// ==================== Webhook API ====================

export const webhookApi = {
  register: (url: string, events: string[], secret?: string) =>
    apiWithAuth('/v1/webhooks', { method: 'POST', body: JSON.stringify({ url, events, secret }) }),
  list: () => apiWithAuth('/v1/webhooks'),
  delete: (webhookId: string) => apiWithAuth(`/v1/webhooks/${webhookId}`, { method: 'DELETE' }),
  test: (webhookId: string) => apiWithAuth(`/v1/webhooks/${webhookId}/test`, { method: 'POST' }),
  getLogs: (webhookId: string) => apiWithAuth(`/v1/webhooks/${webhookId}/logs`),
};

// ==================== Notification API ====================

export const notificationApi = {
  send: (to: string, template: string, data: any) =>
    apiWithAuth('/v1/notifications/send', { method: 'POST', body: JSON.stringify({ to, template, data }) }),
  sendBulk: (recipients: { to: string; template: string; data: any }[]) =>
    apiWithAuth('/v1/notifications/bulk', { method: 'POST', body: JSON.stringify({ recipients }) }),
  getHistory: (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiWithAuth(`/v1/notifications/history?${query}`);
  },
};

// ==================== RBI Compliance API ====================

export const rbiApi = {
  getPortfolioClassification: () => apiWithAuth('/v1/rbi/portfolio-classification'),
  runClassification: () => apiWithAuth('/v1/rbi/run-classification', { method: 'POST' }),
  getProvisioningReport: () => apiWithAuth('/v1/rbi/provisioning-report'),
  getLoanClassification: (loanId: string) => apiWithAuth(`/v1/rbi/loan/${loanId}/classification`),
  classifyLoan: (loanId: string) => apiWithAuth(`/v1/rbi/loan/${loanId}/classify`, { method: 'POST' }),
  getSMATracking: () => apiWithAuth('/v1/rbi/sma-tracking'),
  getAuditTrail: (params?: { action?: string; startDate?: string; endDate?: string; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiWithAuth(`/v1/rbi/audit-trail?${query}`);
  },
  getRBIReport: (reportType: string) => apiWithAuth(`/v1/rbi/rbi-report/${reportType}`),
};

// ==================== Bank Statement Analysis API ====================

export const statementAnalysisApi = {
  parseStatement: (file: File, applicationId: string, userId: string) => {
    const formData = new FormData();
    formData.append('statement', file);
    formData.append('applicationId', applicationId);
    formData.append('userId', userId);
    return apiWithAuth('/v1/statement-analysis/parse', { method: 'POST', body: formData });
  },
  getAnalysis: (applicationId: string) => 
    apiWithAuth(`/v1/statement-analysis/${applicationId}`),
  getSummary: (applicationId: string) => 
    apiWithAuth(`/v1/statement-analysis/${applicationId}/summary`),
  deleteAnalysis: (statementId: string) => 
    apiWithAuth(`/v1/statement-analysis/${statementId}`, { method: 'DELETE' }),
};

// Extend originationApi with statement analysis methods
Object.assign(originationApi, {
  parseStatement: (file: File, applicationId: string, userId: string) =>
    statementAnalysisApi.parseStatement(file, applicationId, userId),
  getStatementAnalysis: (applicationId: string) =>
    statementAnalysisApi.getAnalysis(applicationId).then(res => parseResponse(res)),
  getStatementSummary: (applicationId: string) =>
    statementAnalysisApi.getSummary(applicationId).then(res => parseResponse(res)),
});

// ==================== ML Prediction API ====================

export const predictionApi = {
  predict: (data: {
    userId: string;
    applicationId?: string;
    monthlyIncome: number;
    existingEmi?: number;
    creditScore?: number;
    employmentType?: string;
    requestedLoanAmount: number;
    requestedTenure?: number;
    bankStatementId?: string;
  }) => apiWithAuth('/v1/prediction/predict', { method: 'POST', body: JSON.stringify(data) }),
  
  quickEstimate: (data: {
    monthlyIncome: number;
    existingEmi?: number;
    creditScore?: number;
    employmentType?: string;
    loanAmount: number;
  }) => apiWithAuth('/v1/prediction/quick-estimate', { method: 'POST', body: JSON.stringify(data) }),
  
  getHistory: () => apiWithAuth('/v1/prediction/history'),
  
  getPrediction: (predictionId: string) => apiWithAuth(`/v1/prediction/${predictionId}`),
  
  compareScenarios: (data: {
    userId: string;
    applicationId: string;
    monthlyIncome: number;
    existingEmi?: number;
    creditScore?: number;
    employmentType?: string;
    scenarios: Array<{ loanAmount: number; tenure?: number; purpose?: string }>;
  }) => apiWithAuth('/v1/prediction/scenarios', { method: 'POST', body: JSON.stringify(data) }),
};

// ==================== Underwriting API ====================

export const underwritingApi = {
  /**
   * Call the live deterministic underwriting engine.
   * Pass an `idempotencyKey` so retries on timeout don't double-charge or
   * double-log (Decision 11).
   */
  analyze: (payload: unknown, idempotencyKey?: string) =>
    apiWithAuth('/v1/underwriting/analyze', {
      method: 'POST',
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
      body: JSON.stringify(payload),
    }),

  /** Fetch the tamper-evident audit PDF for a past decision (authoritative). */
  auditPdf: (auditId: string) =>
    apiWithAuth(`/v1/underwriting/audit/${encodeURIComponent(auditId)}/pdf`),
};

// ==================== Enhanced Bureau API ====================

export const enhancedBureauApi = {
  fetchReport: (data: {
    userId: string;
    pan: string;
    borrowerId?: string;
    orgId?: string;
    forceRefresh?: boolean;
  }) => apiWithAuth('/v1/enhanced-bureau/fetch-report', { method: 'POST', body: JSON.stringify(data) }),

  calculateMetrics: (data: { userId: string; pan: string; borrowerId?: string; orgId?: string }) =>
    apiWithAuth('/v1/enhanced-bureau/calculate-metrics', { method: 'POST', body: JSON.stringify(data) }),

  getMetrics: (userId: string) => apiWithAuth(`/v1/enhanced-bureau/metrics/${userId}`),

  batchFetch: (users: Array<{ userId: string; pan: string; borrowerId?: string; orgId?: string }>) =>
    apiWithAuth('/v1/enhanced-bureau/batch-fetch', { method: 'POST', body: JSON.stringify({ users }) }),

  getSummary: (userId: string) => apiWithAuth(`/v1/enhanced-bureau/summary/${userId}`),

  clearCache: () =>
    apiWithAuth('/v1/enhanced-bureau/cache/clear', { method: 'POST', body: JSON.stringify({}) }),
};
