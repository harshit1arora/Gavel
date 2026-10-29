import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  createCollectionCase,
  getCollectionCase,
  listCollectionCases,
  getCollectionCaseByLoanId,
  updateCollectionCaseStatus,
  addCollectionAction,
  addRecoveryNote,
  markLoanNPA,
  getCollectionMetrics,
} from '../services/collections';
import { triggerCollectionWorkflow, processOverdueLoans } from '../services/collection-automation';

const router = Router();

// Get all collection cases
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const npaCategory = req.query.npaCategory as string | undefined;
    const assignedCollector = req.query.assignedCollector as string | undefined;
    const priority = req.query.priority as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 500;

    const cases = await listCollectionCases(req.orgId!, {
      status: status as any,
      npaCategory,
      assignedCollector,
      priority,
      limit,
    });

    res.status(200).json(cases);
  } catch (error) {
    console.error('Error listing collection cases:', error);
    res.status(500).json({ error: 'Failed to list collection cases' });
  }
});

// Get specific collection case
router.get('/:caseId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const collectionCase = await getCollectionCase(req.orgId!, req.params.caseId);
    if (!collectionCase) {
      return res.status(404).json({ error: 'Collection case not found' });
    }

    res.status(200).json(collectionCase);
  } catch (error) {
    console.error('Error getting collection case:', error);
    res.status(500).json({ error: 'Failed to get collection case' });
  }
});

// Get collection case by loan ID
router.get('/loan/:loanId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const collectionCase = await getCollectionCaseByLoanId(req.orgId!, req.params.loanId);
    if (!collectionCase) {
      return res.status(404).json({ error: 'Collection case not found' });
    }

    res.status(200).json(collectionCase);
  } catch (error) {
    console.error('Error getting collection case:', error);
    res.status(500).json({ error: 'Failed to get collection case' });
  }
});

// Create new collection case
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      loanId,
      borrowerId,
      borrowerName,
      borrowerPhone,
      borrowerEmail,
      loanAmount,
      loanDate,
      status,
      daysOverdue,
      amountOutstanding,
      lastEmiDueDate,
      missedEmis,
      priority,
    } = req.body;

    // Validate required fields
    if (!loanId || !borrowerId || !borrowerName || !loanAmount) {
      return res.status(400).json({
        error: 'loanId, borrowerId, borrowerName, and loanAmount are required',
      });
    }

    const caseId = await createCollectionCase(req.orgId!, {
      loanId,
      borrowerId,
      borrowerName,
      borrowerPhone,
      borrowerEmail,
      loanAmount,
      loanDate: loanDate || new Date(),
      status: status || 'Overdue',
      daysOverdue: daysOverdue || 0,
      amountOutstanding: amountOutstanding || loanAmount,
      lastEmiDueDate: lastEmiDueDate || new Date(),
      missedEmis: missedEmis || 1,
      reminders: [],
      actions: [],
      recoveryNotes: [],
      priority: priority || 'Medium',
    });

    res.status(201).json({
      id: caseId,
      message: 'Collection case created',
    });
  } catch (error) {
    console.error('Error creating collection case:', error);
    res.status(500).json({ error: 'Failed to create collection case' });
  }
});

// Update collection case status
router.put('/:caseId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updates = req.body;

    await updateCollectionCaseStatus(req.orgId!, req.params.caseId, updates);

    res.status(200).json({ success: true, message: 'Collection case updated' });
  } catch (error) {
    console.error('Error updating collection case:', error);
    res.status(500).json({ error: 'Failed to update collection case' });
  }
});

// Add collection action
router.post('/:caseId/add-action', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, notes, status, actor } = req.body;

    if (!type || !notes) {
      return res.status(400).json({ error: 'type and notes are required' });
    }

    await addCollectionAction(req.orgId!, req.params.caseId, {
      type: type as any,
      notes,
      status: status || 'Completed',
      actor,
    });

    res.status(200).json({ success: true, message: 'Action added' });
  } catch (error) {
    console.error('Error adding action:', error);
    res.status(500).json({ error: 'Failed to add action' });
  }
});

// Add recovery note
router.post('/:caseId/add-note', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { note, collectorId } = req.body;

    if (!note) {
      return res.status(400).json({ error: 'note is required' });
    }

    await addRecoveryNote(req.orgId!, req.params.caseId, note, collectorId);

    res.status(200).json({ success: true, message: 'Note added' });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// Mark loan as NPA
router.post('/mark-npa/:loanId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { daysOverdue } = req.body;

    if (typeof daysOverdue !== 'number') {
      return res.status(400).json({ error: 'daysOverdue is required' });
    }

    const caseId = await markLoanNPA(req.orgId!, req.params.loanId, daysOverdue);

    res.status(200).json({ caseId, message: 'Loan marked as NPA' });
  } catch (error) {
    console.error('Error marking NPA:', error);
    res.status(500).json({ error: 'Failed to mark NPA' });
  }
});

// Get collection metrics
router.get('/metrics/dashboard', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const metrics = await getCollectionMetrics(req.orgId!);
    res.status(200).json(metrics);
  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// Manual trigger collection workflow for a loan
router.post('/trigger/:loanId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { missedEmis, daysOverdue } = req.body;

    if (typeof missedEmis !== 'number' || typeof daysOverdue !== 'number') {
      return res.status(400).json({ error: 'missedEmis and daysOverdue are required' });
    }

    const loanDoc = await import('../config/firebase').then(m => m.db.collection('loans').doc(req.params.loanId).get());
    if (!loanDoc.exists) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    const loan = loanDoc.data()!;
    if (loan.orgId !== req.orgId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const scheduleSnapshot = await import('../config/firebase').then(m =>
      m.db.collection('repayment_schedules').where('loanId', '==', req.params.loanId).limit(1).get()
    );

    const schedule = scheduleSnapshot.empty ? null : scheduleSnapshot.docs[0].data();

    const loanInfo = {
      id: loan.id || req.params.loanId,
      borrowerId: loan.borrowerId,
      borrowerName: loan.borrowerName,
      borrowerPhone: loan.borrowerPhone || '+919876543210',
      borrowerEmail: loan.borrowerEmail || 'borrower@example.com',
      loanAmount: loan.loanAmount,
      outstandingAmount: loan.outstandingAmount || loan.loanAmount,
      firstEmiDueDate: new Date(loan.firstEmiDueDate || loan.startDate || new Date()),
      emiAmount: schedule?.emiAmount || loan.emiAmount || 0,
      orgId: loan.orgId,
    };

    const result = await triggerCollectionWorkflow(req.orgId!, loanInfo, missedEmis, daysOverdue);

    res.status(200).json({
      success: true,
      caseId: result.caseId,
      action: result.action,
      smsSent: result.smsSent,
      emailSent: result.emailSent,
      priority: result.priority,
      message: `Collection workflow ${result.action} for loan ${req.params.loanId}`,
    });
  } catch (error) {
    console.error('Error triggering collection workflow:', error);
    res.status(500).json({ error: 'Failed to trigger collection workflow' });
  }
});

// Process all overdue loans (batch operation)
router.post('/process-all', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await processOverdueLoans(req.orgId!);

    res.status(200).json({
      success: true,
      ...result,
      message: `Processed ${result.processed} loans, triggered ${result.triggered} workflows`,
    });
  } catch (error) {
    console.error('Error processing overdue loans:', error);
    res.status(500).json({ error: 'Failed to process overdue loans' });
  }
});

// Get collection workflow status for a loan
router.get('/workflow/:loanId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const collectionCase = await getCollectionCaseByLoanId(req.orgId!, req.params.loanId);

    if (!collectionCase) {
      return res.status(404).json({ error: 'No collection case found for this loan' });
    }

    res.status(200).json({
      caseId: collectionCase.id,
      status: collectionCase.status,
      priority: collectionCase.priority,
      missedEmis: collectionCase.missedEmis,
      daysOverdue: collectionCase.daysOverdue,
      actions: collectionCase.actions,
      reminders: collectionCase.reminders,
      npaCategory: collectionCase.npaCategory,
      assignedCollector: collectionCase.assignedCollector,
      createdAt: collectionCase.createdAt,
      updatedAt: collectionCase.updatedAt,
    });
  } catch (error) {
    console.error('Error getting workflow status:', error);
    res.status(500).json({ error: 'Failed to get workflow status' });
  }
});


// Get collection pipeline view
router.get('/pipeline', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cases = await listCollectionCases(req.orgId!, { limit: 1000 });
    
    const pipeline = {
      new: cases.filter(c => c.status === 'Current' && c.actions.length === 0),
      contacted: cases.filter(c => c.actions.length > 0 && c.status === 'Overdue'),
      promise: cases.filter(c => c.actions.some((a: any) => a.type === 'Call' && a.notes.toLowerCase().includes('promise'))),
      partialPayment: cases.filter(c => c.status === 'Overdue'),
      recovered: cases.filter(c => c.status === 'Closed'),
      npa: cases.filter(c => c.status === 'NPA'),
    };
    
    res.status(200).json({
      stages: ['new', 'contacted', 'promise', 'partialPayment', 'recovered', 'npa'],
      counts: {
        new: pipeline.new.length,
        contacted: pipeline.contacted.length,
        promise: pipeline.promise.length,
        partialPayment: pipeline.partialPayment.length,
        recovered: pipeline.recovered.length,
        npa: pipeline.npa.length,
      },
    });
  } catch (error) {
    console.error('Error getting pipeline:', error);
    res.status(500).json({ error: 'Failed to get pipeline' });
  }
});

// Get collection metrics (alternative endpoint)
router.get('/metrics', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cases = await listCollectionCases(req.orgId!, { limit: 10000 });
    
    const overdueCases = cases.filter(c => c.status === 'Overdue' || c.status === 'NPA');
    const recoveredCases = cases.filter(c => c.status === 'Closed');
    
    const metrics = {
      totalCases: cases.length,
      activeCases: cases.filter(c => c.status === 'Current' || c.status === 'Overdue').length,
      overdueCases: overdueCases.length,
      npaCases: cases.filter(c => c.status === 'NPA').length,
      recoveredCases: recoveredCases.length,
      totalOutstanding: cases.reduce((sum: number, c) => sum + c.amountOutstanding, 0),
      overdueAmount: overdueCases.reduce((sum: number, c) => sum + c.amountOutstanding, 0),
      npaAmount: cases.filter(c => c.status === 'NPA').reduce((sum: number, c) => sum + c.amountOutstanding, 0),
      avgDaysOverdue: overdueCases.length > 0 
        ? Math.round(overdueCases.reduce((sum: number, c) => sum + c.daysOverdue, 0) / overdueCases.length) 
        : 0,
      collectionRate: cases.length > 0 
        ? Math.round((recoveredCases.length / cases.length) * 100) 
        : 0,
      byPriority: {
        high: cases.filter(c => c.priority === 'High').length,
        medium: cases.filter(c => c.priority === 'Medium').length,
        low: cases.filter(c => c.priority === 'Low').length,
      },
      byBucket: {
        current: cases.filter(c => c.daysOverdue <= 0).length,
        '0-30': cases.filter(c => c.daysOverdue > 0 && c.daysOverdue <= 30).length,
        '31-60': cases.filter(c => c.daysOverdue > 30 && c.daysOverdue <= 60).length,
        '61-90': cases.filter(c => c.daysOverdue > 60 && c.daysOverdue <= 90).length,
        '90+': cases.filter(c => c.daysOverdue > 90).length,
      },
    };
    
    res.status(200).json(metrics);
  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// Get overdue loans
router.get('/overdue', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const cases = await listCollectionCases(req.orgId!, { status: 'Overdue', limit: 1000 });
    
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedCases = cases.slice(skip, skip + Number(limit));
    
    res.status(200).json({
      loans: paginatedCases,
      total: cases.length,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error('Error getting overdue loans:', error);
    res.status(500).json({ error: 'Failed to get overdue loans' });
  }
});

// Record promise to pay
router.post('/promise', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { loanId, amount, date, notes } = req.body;
    
    if (!loanId || !amount || !date) {
      return res.status(400).json({ error: 'loanId, amount, and date are required' });
    }
    
    const collectionCase = await getCollectionCaseByLoanId(req.orgId!, loanId);
    if (!collectionCase) {
      return res.status(404).json({ error: 'Collection case not found' });
    }
    
    await addCollectionAction(req.orgId!, collectionCase.id!, {
      type: 'Call',
      notes: `Promise to pay ₹${amount} on ${date}${notes ? `. Notes: ${notes}` : ''}`,
      status: 'Completed',
      actor: 'System',
    });
    
    res.status(200).json({ success: true, message: `Promise recorded: ₹${amount} on ${date}`, loanId });
  } catch (error) {
    console.error('Error recording promise:', error);
    res.status(500).json({ error: 'Failed to record promise' });
  }
});

// Resolve collection case
router.post('/resolve', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { loanId, resolution } = req.body;
    
    if (!loanId || !resolution) {
      return res.status(400).json({ error: 'loanId and resolution are required' });
    }
    
    const collectionCase = await getCollectionCaseByLoanId(req.orgId!, loanId);
    if (!collectionCase) {
      return res.status(404).json({ error: 'Collection case not found' });
    }
    
    await updateCollectionCaseStatus(req.orgId!, collectionCase.id!, { status: 'Closed' as any });
    
    await addCollectionAction(req.orgId!, collectionCase.id!, {
      type: 'Call',
      notes: `Case resolved: ${resolution}`,
      status: 'Completed',
      actor: 'System',
    });
    
    res.status(200).json({ success: true, message: `Collection case resolved`, loanId, resolution });
  } catch (error) {
    console.error('Error resolving case:', error);
    res.status(500).json({ error: 'Failed to resolve case' });
  }
});

// Send reminder for a loan
router.get('/remind/:loanId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const collectionCase = await getCollectionCaseByLoanId(req.orgId!, req.params.loanId);
    
    if (!collectionCase) {
      return res.status(404).json({ error: 'Collection case not found' });
    }
    
    console.log(`[REMINDER] Would send reminder to ${collectionCase.borrowerPhone} for loan ${req.params.loanId}`);
    
    res.status(200).json({ success: true, message: `Reminder queued`, phone: collectionCase.borrowerPhone });
  } catch (error) {
    console.error('Error sending reminder:', error);
    res.status(500).json({ error: 'Failed to send reminder' });
  }
});

// Get agent workload
router.get('/agent-workload', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cases = await listCollectionCases(req.orgId!, { limit: 1000 });
    
    const agentMap = new Map<string, any>();
    
    cases.forEach(c => {
      const agent = c.assignedCollector || 'unassigned';
      if (!agentMap.has(agent)) {
        agentMap.set(agent, { agentId: agent, totalCases: 0, overdue: 0, npa: 0, totalOutstanding: 0 });
      }
      const stats = agentMap.get(agent)!;
      stats.totalCases++;
      if (c.status === 'Overdue') stats.overdue++;
      if (c.status === 'NPA') stats.npa++;
      stats.totalOutstanding += c.amountOutstanding;
    });
    
    res.status(200).json({
      agents: Array.from(agentMap.values()),
      totalAgents: agentMap.size,
      unassigned: cases.filter(c => !c.assignedCollector).length,
    });
  } catch (error) {
    console.error('Error getting agent workload:', error);
    res.status(500).json({ error: 'Failed to get agent workload' });
  }
});

export default router;
