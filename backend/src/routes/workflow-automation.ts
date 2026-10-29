import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateFirebaseToken } from '../middleware/auth';
import { db, Timestamp } from '../config/firebase';
import crypto from 'crypto';

const router = Router();

export interface WorkflowTemplate {
  id: string;
  orgId: string;
  name: string;
  description: string;
  stages: WorkflowStageConfig[];
  autoApproveThreshold: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStageConfig {
  name: string;
  order: number;
  type: 'kyc' | 'bank_analysis' | 'credit_evaluation' | 'decision' | 'agreement' | 'disbursement' | 'repayment' | 'custom';
  webhookUrl?: string;
  webhookEvent?: string;
  timeout?: number;
  retryCount?: number;
  requiredFields?: string[];
  skipOnCondition?: string;
}

export interface WorkflowState {
  id: string;
  orgId: string;
  applicationId: string;
  templateId?: string;
  templateName?: string;
  currentStage: string;
  stages: WorkflowStage[];
  data: {
    application?: any;
    kyc?: any;
    bankAnalysis?: any;
    evaluation?: any;
    decision?: any;
    agreement?: any;
    disbursement?: any;
    repayment?: any;
    [key: string]: any;
  };
  errors: string[];
  autoApproveThreshold: number;
  startedAt: Date;
  completedAt?: Date;
  updatedAt: Date;
  webhookUrl?: string;
}

export interface WorkflowStage {
  name: string;
  order: number;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  data?: any;
  webhookUrl?: string;
  webhookEvent?: string;
  attempts: number;
  outputs?: Record<string, any>;
  retryCount?: number;
}

async function fetchWebhook(url: string, event: string, payload: any, attempt: number) {
  const payloadStr = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', process.env.WEBHOOK_SIGNING_SECRET || 'gavel-webhook-secret').update(payloadStr).digest('hex');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Gavel-Signature': `sha256=${signature}`,
      'X-Gavel-Event': event,
      'X-Gavel-Attempt': String(attempt),
    },
    body: payloadStr,
    signal: AbortSignal.timeout(10000),
  });

  return response.ok;
}

function simulateDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateScore(app: any, data: any): number {
  let score = 50;
  if (app.monthlyIncome >= 50000) score += 20;
  else if (app.monthlyIncome >= 30000) score += 10;
  if (app.employmentType === 'Salaried') score += 15;
  else if (app.employmentType === 'Self-Employed') score += 5;
  const ratio = app.loanAmount / app.monthlyIncome;
  if (ratio <= 12) score += 15;
  else if (ratio <= 24) score += 5;
  else score -= 10;
  return Math.min(100, Math.max(0, score));
}

function validateOrgId(orgId: string): boolean {
  return /^[a-zA-Z0-9_-]{1,128}$/.test(orgId);
}

function sanitizeString(str: unknown, maxLen = 1000): string {
  if (typeof str !== 'string') return '';
  return str.substring(0, maxLen).replace(/[<>]/g, '');
}

// ==================== TEMPLATES ====================

router.post('/templates', authenticateFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    const { name, description, stages, autoApproveThreshold } = req.body;

    if (!name || !stages || !Array.isArray(stages) || stages.length === 0) {
      return res.status(400).json({ error: 'Name and stages array required' });
    }

    const templateId = `wftpl_${Date.now()}`;
    const templateStages: WorkflowStageConfig[] = stages.map((s: any, idx: number) => ({
      name: sanitizeString(s.name, 100),
      order: idx,
      type: sanitizeString(s.type || 'custom', 50) as any,
      webhookUrl: s.webhookUrl || undefined,
      webhookEvent: s.webhookEvent || undefined,
      timeout: s.timeout || 30000,
      retryCount: s.retryCount || 3,
      requiredFields: s.requiredFields || [],
      skipOnCondition: s.skipOnCondition || undefined,
    }));

    const template: WorkflowTemplate = {
      id: templateId,
      orgId,
      name: sanitizeString(name, 200),
      description: sanitizeString(description || '', 500),
      stages: templateStages,
      autoApproveThreshold: autoApproveThreshold || 75,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('workflow_templates').doc(templateId).set(template);

    res.status(201).json({ ...template, id: templateId });
  } catch (error: any) {
    console.error('Error creating workflow template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

router.get('/templates', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    const snapshot = await db.collection('workflow_templates')
      .where('orgId', '==', orgId)
      .where('isActive', '==', true)
      .get();

    const templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(templates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/templates/:templateId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = await db.collection('workflow_templates').doc(req.params.templateId).get();
    if (!doc.exists || doc.data()!.orgId !== req.orgId) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== WORKFLOWS ====================

router.post('/start', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    if (!validateOrgId(orgId)) {
      return res.status(400).json({ error: 'Invalid org ID' });
    }

    const { application, templateId, autoApproveThreshold = 75 } = req.body;

    if (!application) {
      return res.status(400).json({ error: 'application data is required' });
    }

    const applicationId = sanitizeString(application.id || `APP-${Date.now()}`, 50);
    const workflowId = `WF-${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    let stages: WorkflowStageConfig[] = [
      { name: 'application_received', order: 0, type: 'kyc' },
      { name: 'kyc_verification', order: 1, type: 'kyc' },
      { name: 'bank_statement_analysis', order: 2, type: 'bank_analysis' },
      { name: 'credit_evaluation', order: 3, type: 'credit_evaluation' },
      { name: 'decision', order: 4, type: 'decision' },
      { name: 'agreement_generation', order: 5, type: 'agreement' },
      { name: 'disbursement', order: 6, type: 'disbursement' },
      { name: 'repayment_setup', order: 7, type: 'repayment' },
    ];

    let templateName = 'Default Pipeline';

    if (templateId) {
      const tplDoc = await db.collection('workflow_templates').doc(templateId).get();
      if (tplDoc.exists && tplDoc.data()!.orgId === orgId) {
        stages = tplDoc.data()!.stages;
        templateName = tplDoc.data()!.name;
      }
    }

    const workflowStages: WorkflowStage[] = stages.map((s, idx) => ({
      name: s.name,
      order: idx,
      type: s.type,
      status: idx === 0 ? 'processing' : 'pending',
      startedAt: idx === 0 ? new Date() : undefined,
      webhookUrl: s.webhookUrl,
      webhookEvent: s.webhookEvent,
      attempts: 0,
      retryCount: s.retryCount,
    }));

    const workflow: WorkflowState = {
      id: workflowId,
      orgId,
      applicationId,
      templateId: templateId || undefined,
      templateName,
      currentStage: stages[0].name,
      stages: workflowStages,
      data: {
        application: {
          ...application,
          id: applicationId,
          referenceId: `REF${Date.now().toString().slice(-8)}${applicationId}`,
          submittedAt: new Date().toISOString(),
        },
      },
      errors: [],
      autoApproveThreshold,
      startedAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('workflows').doc(workflowId).set(workflow);

    await db.collection('audit_logs').add({
      orgId,
      action: 'WORKFLOW_STARTED',
      targetId: workflowId,
      detail: `Workflow started for ${applicationId} using template ${templateName}`,
      timestamp: Timestamp.now(),
    });

    processApplication(workflowId, autoApproveThreshold).catch(err => {
      console.error('Workflow processing error:', err);
    });

    res.status(202).json({
      workflowId,
      applicationId,
      status: 'processing',
      currentStage: stages[0].name,
      message: 'Application workflow started',
    });
  } catch (error: any) {
    console.error('Error starting workflow:', error);
    res.status(500).json({ error: 'Failed to start workflow' });
  }
});

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    let query: any = db.collection('workflows').where('orgId', '==', req.orgId!);
    if (status && status !== 'all') query = query.where('currentStage', '==', status);

    const snapshot = await query
      .orderBy('updatedAt', 'desc')
      .offset((pageNum - 1) * limitNum)
      .limit(limitNum)
      .get();

    const workflows = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    const total = (await query.get()).size;

    res.status(200).json({ total, page: pageNum, limit: limitNum, workflows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:workflowId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = await db.collection('workflows').doc(req.params.workflowId).get();
    if (!doc.exists || doc.data()!.orgId !== req.orgId) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:workflowId/trigger/:stage', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = await db.collection('workflows').doc(req.params.workflowId).get();
    if (!doc.exists || doc.data()!.orgId !== req.orgId) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const workflow = doc.data() as WorkflowState;
    const stageIndex = workflow.stages.findIndex(s => s.name === req.params.stage);
    if (stageIndex === -1) {
      return res.status(400).json({ error: 'Invalid stage' });
    }

    await processStage(workflow, stageIndex);
    await db.collection('workflows').doc(req.params.workflowId).update({
      stages: workflow.stages,
      currentStage: workflow.currentStage,
      data: workflow.data,
      errors: workflow.errors,
      updatedAt: Timestamp.now(),
    } as any);

    res.status(200).json({ ...workflow, id: doc.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:workflowId/cancel', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = await db.collection('workflows').doc(req.params.workflowId).get();
    if (!doc.exists || doc.data()!.orgId !== req.orgId) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const workflow = doc.data() as WorkflowState;
    if (workflow.currentStage === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel completed workflow' });
    }

    const currentIdx = workflow.stages.findIndex(s => s.name === workflow.currentStage);
    if (currentIdx !== -1) {
      workflow.stages[currentIdx].status = 'failed';
      workflow.stages[currentIdx].completedAt = new Date();
    }

    for (let i = currentIdx + 1; i < workflow.stages.length; i++) {
      workflow.stages[i].status = 'skipped';
    }
    workflow.currentStage = 'cancelled';
    workflow.completedAt = new Date();
    workflow.updatedAt = new Date();

    await db.collection('workflows').doc(req.params.workflowId).update(workflow as any);

    await db.collection('audit_logs').add({
      orgId: req.orgId!,
      action: 'WORKFLOW_CANCELLED',
      targetId: req.params.workflowId,
      detail: `Workflow cancelled at stage ${workflow.stages[currentIdx]?.name || 'unknown'}`,
      timestamp: Timestamp.now(),
    });

    res.status(200).json({ message: 'Workflow cancelled', workflow });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:workflowId/retry', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = await db.collection('workflows').doc(req.params.workflowId).get();
    if (!doc.exists || doc.data()!.orgId !== req.orgId) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const workflow = doc.data() as WorkflowState;
    const failedIdx = workflow.stages.findIndex(s => s.status === 'failed');
    if (failedIdx === -1) {
      return res.status(400).json({ error: 'No failed stage to retry' });
    }

    workflow.stages[failedIdx].status = 'processing';
    workflow.currentStage = workflow.stages[failedIdx].name;
    await processStage(workflow, failedIdx);

    await db.collection('workflows').doc(req.params.workflowId).update({
      stages: workflow.stages,
      currentStage: workflow.currentStage,
      data: workflow.data,
      updatedAt: Timestamp.now(),
    } as any);

    res.status(200).json({ ...workflow, id: doc.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/analytics/summary', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snapshot = await db.collection('workflows').where('orgId', '==', req.orgId!).get();
    const workflows = snapshot.docs.map((doc: any) => doc.data() as WorkflowState);

    const total = workflows.length;
    const completed = workflows.filter(w => w.currentStage === 'completed').length;
    const processing = workflows.filter(w => w.stages.some(s => s.status === 'processing')).length;
    const failed = workflows.filter(w => w.stages.some(s => s.status === 'failed')).length;

    const completedWorkflows = workflows.filter(w => w.completedAt);
    const avgTime = completedWorkflows.reduce((sum, w) => {
      return sum + (new Date(w.completedAt!).getTime() - new Date(w.startedAt).getTime());
    }, 0) / (completed || 1);

    res.status(200).json({
      total,
      completed,
      processing,
      failed,
      successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgProcessingTime: `${Math.round(avgTime / 1000)}s`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PROCESSING ====================

async function processApplication(workflowId: string, autoApproveThreshold: number) {
  const doc = await db.collection('workflows').doc(workflowId).get();
  if (!doc.exists) return;

  const workflow = doc.data() as WorkflowState;
  try {
    for (let i = 0; i < workflow.stages.length; i++) {
      if (workflow.stages[i].status === 'pending' || workflow.stages[i].status === 'processing') {
        await processStage(workflow, i, autoApproveThreshold);
      }
    }

    if (workflow.stages.every(s => s.status === 'completed' || s.status === 'skipped')) {
      workflow.currentStage = 'completed';
      workflow.completedAt = new Date();
    }
    workflow.updatedAt = new Date();
    await doc.ref.update(workflow as any);

    if (workflow.webhookUrl) {
      fetchWebhook(workflow.webhookUrl, 'workflow.completed', workflow, 1).catch(() => {});
    }
  } catch (error) {
    console.error('Workflow processing error:', error);
    workflow.errors.push(String(error));
    workflow.updatedAt = new Date();
    await doc.ref.update(workflow as any);
  }
}

async function processStage(workflow: WorkflowState, stageIndex: number, autoApproveThreshold?: number) {
  const stage = workflow.stages[stageIndex];
  const app = workflow.data.application;

  stage.status = 'processing';
  stage.startedAt = new Date();

  try {
    switch (stage.type) {
      case 'kyc': {
        if (stage.name === 'application_received') {
          await simulateDelay(500);
          stage.status = 'completed';
          stage.data = { received: true, applicationId: app.id };
        } else {
          await simulateDelay(1500);
          workflow.data.kyc = {
            aadhaarVerified: true,
            panVerified: true,
            dobMatched: true,
            nameMatched: true,
          };
          stage.status = 'completed';
          stage.data = { verified: true };
        }
        break;
      }
      case 'bank_analysis': {
        await simulateDelay(2000);
        workflow.data.bankAnalysis = {
          monthlyIncome: app.monthlyIncome * (0.9 + Math.random() * 0.2),
          averageBalance: app.monthlyIncome * 2,
          salaryCredits: 12,
          emiPayments: 0,
          bouncedPayments: 0,
          analysis: 'Clean banking history',
        };
        stage.status = 'completed';
        stage.data = { analyzed: true };
        break;
      }
      case 'credit_evaluation': {
        await simulateDelay(1500);
        const score = calculateScore(app, workflow.data);
        workflow.data.evaluation = {
          score,
          riskLevel: score >= 75 ? 'low' : score >= 50 ? 'medium' : 'high',
          positive: getPositiveFactors(app, workflow.data),
          negative: getNegativeFactors(app, workflow.data),
        };
        stage.status = 'completed';
        stage.data = { evaluated: true, score };
        break;
      }
      case 'decision': {
        await simulateDelay(500);
        const evaluation = workflow.data.evaluation;
        const threshold = autoApproveThreshold || workflow.autoApproveThreshold;
        const decision = evaluation.score >= threshold
          ? 'approved'
          : evaluation.score >= 50 ? 'review' : 'rejected';

        workflow.data.decision = {
          decision,
          score: evaluation.score,
          reasons: decision === 'approved'
            ? ['High credit score', 'Stable income', 'Clean history']
            : decision === 'rejected'
            ? ['Low credit score', 'High debt burden']
            : ['Manual review recommended'],
        };
        stage.status = 'completed';
        stage.data = { decided: true, decision };
        break;
      }
      case 'agreement': {
        if (workflow.data.decision?.decision !== 'approved') {
          stage.status = 'skipped';
          break;
        }
        await simulateDelay(1000);
        workflow.data.agreement = {
          documentId: `DOC-${Date.now()}`,
          generatedAt: new Date().toISOString(),
          terms: {
            loanAmount: app.loanAmount,
            interestRate: 12,
            tenure: app.tenure,
            emi: Math.round(app.loanAmount / app.tenure),
          },
        };
        stage.status = 'completed';
        stage.data = { generated: true };
        break;
      }
      case 'disbursement': {
        if (workflow.data.decision?.decision !== 'approved') {
          stage.status = 'skipped';
          break;
        }
        await simulateDelay(2000);
        workflow.data.disbursement = {
          transactionId: `TXN-${Date.now()}`,
          status: 'completed',
          amount: app.loanAmount,
          bankAccount: 'XXXX' + Math.floor(Math.random() * 9000 + 1000),
          processedAt: new Date().toISOString(),
        };
        stage.status = 'completed';
        stage.data = { disbursed: true };
        break;
      }
      case 'repayment': {
        if (workflow.data.decision?.decision !== 'approved') {
          stage.status = 'skipped';
          break;
        }
        await simulateDelay(500);
        workflow.data.repayment = {
          scheduleId: `SCH-${Date.now()}`,
          emiAmount: Math.round(app.loanAmount / app.tenure),
          firstDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          totalEmis: app.tenure,
        };
        stage.status = 'completed';
        stage.data = { setup: true };
        break;
      }
      default: {
        await simulateDelay(500);
        stage.data = { processed: true };
        stage.status = 'completed';
      }
    }

    stage.completedAt = new Date();
    workflow.currentStage = stageIndex < workflow.stages.length - 1
      ? workflow.stages[stageIndex + 1].name
      : 'completed';

    if (stage.webhookUrl) {
      stage.attempts++;
      const success = await fetchWebhook(stage.webhookUrl, stage.webhookEvent || `stage.${stage.name}`, {
        workflowId: workflow.id,
        applicationId: workflow.applicationId,
        stage: stage.name,
        status: stage.status,
        data: stage.data,
        orgId: workflow.orgId,
      }, stage.attempts);
      if (!success && stage.attempts < (stage.retryCount || 3)) {
        stage.status = 'processing';
      }
    }
  } catch (error: any) {
    stage.status = 'failed';
    stage.error = error.message || String(error);
    workflow.errors.push(`Stage ${stage.name}: ${error}`);
  }
}

function getPositiveFactors(app: any, data: any): string[] {
  const factors = [];
  if (app.monthlyIncome >= 40000) factors.push('High monthly income');
  if (app.employmentType === 'Salaried') factors.push('Stable employment');
  factors.push('Clean credit history');
  return factors;
}

function getNegativeFactors(app: any, data: any): string[] {
  const factors = [];
  if (app.loanAmount / app.monthlyIncome > 24) factors.push('High loan to income ratio');
  return factors;
}

export default router;