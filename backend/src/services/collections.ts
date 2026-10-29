import { db } from '../config/firebase';

export type CollectionStatus = 'Current' | 'Overdue' | 'NPA' | 'Closed';
export type ActionType = 'SMS' | 'Call' | 'Field Visit' | 'Email' | 'Legal Notice' | 'Court Filing';

export interface CollectionAction {
  type: ActionType;
  date: Date | string;
  notes: string;
  actor?: string;
  status: 'Pending' | 'Completed' | 'Scheduled';
}

export interface CollectionCase {
  id?: string;
  loanId: string;
  orgId: string;
  
  // Borrower Info
  borrowerId: string;
  borrowerName: string;
  borrowerPhone: string;
  borrowerEmail: string;
  
  // Loan Details
  loanAmount: number;
  loanDate: Date | string;
  
  // Collection Status
  status: CollectionStatus;
  daysOverdue: number;
  amountOutstanding: number;
  
  // EMI Details
  lastEmiDueDate: Date | string;
  missedEmis: number;
  
  // Collection History
  reminders: Array<{
    date: Date | string;
    type: 'SMS' | 'Email' | 'Call';
    status: 'Sent' | 'Failed' | 'Delivered';
  }>;
  
  actions: CollectionAction[];
  
  // NPA Tracking
  npaStartDate?: Date | string;
  npaAge?: number; // days
  npaCategory?: '30-60 DPD' | '60-90 DPD' | '90+ DPD';
  
  // Recovery Tracking
  recoveryNotes: string[];
  lastCollectorUpdate?: Date | string;
  assignedCollector?: string;
  
  // Metadata
  priority: 'Low' | 'Medium' | 'High';
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export const createCollectionCase = async (
  orgId: string,
  collectionCase: Omit<CollectionCase, 'id' | 'createdAt' | 'updatedAt' | 'orgId'>
): Promise<string> => {
  try {
    const docRef = await db.collection('collections').add({
      ...collectionCase,
      orgId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Audit log
    await db.collection('audit_logs').add({
      orgId,
      action: 'COLLECTION_CASE_CREATED',
      targetId: docRef.id,
      detail: `Collection case created for ${collectionCase.borrowerName}`,
      timestamp: new Date()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating collection case:', error);
    throw error;
  }
};

export const getCollectionCase = async (
  orgId: string,
  caseId: string
): Promise<CollectionCase | null> => {
  try {
    const doc = await db.collection('collections').doc(caseId).get();
    if (!doc.exists) return null;

    const data = doc.data()!;
    if (data.orgId !== orgId) return null;

    return { id: doc.id, ...data } as CollectionCase;
  } catch (error) {
    console.error('Error getting collection case:', error);
    throw error;
  }
};

export const listCollectionCases = async (
  orgId: string,
  filter?: {
    status?: CollectionStatus;
    npaCategory?: string;
    assignedCollector?: string;
    priority?: string;
    limit?: number;
  }
): Promise<CollectionCase[]> => {
  try {
    let query: any = db.collection('collections').where('orgId', '==', orgId);

    if (filter?.status) {
      query = query.where('status', '==', filter.status);
    }
    if (filter?.npaCategory) {
      query = query.where('npaCategory', '==', filter.npaCategory);
    }
    if (filter?.assignedCollector) {
      query = query.where('assignedCollector', '==', filter.assignedCollector);
    }
    if (filter?.priority) {
      query = query.where('priority', '==', filter.priority);
    }

    query = query.orderBy('updatedAt', 'desc').limit(filter?.limit || 500);

    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as CollectionCase[];
  } catch (error) {
    console.error('Error listing collection cases:', error);
    throw error;
  }
};

export const getCollectionCaseByLoanId = async (
  orgId: string,
  loanId: string
): Promise<CollectionCase | null> => {
  try {
    const snapshot = await db.collection('collections')
      .where('orgId', '==', orgId)
      .where('loanId', '==', loanId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as CollectionCase;
  } catch (error) {
    console.error('Error getting collection case by loan ID:', error);
    throw error;
  }
};

export const updateCollectionCaseStatus = async (
  orgId: string,
  caseId: string,
  updates: {
    status?: CollectionStatus;
    daysOverdue?: number;
    amountOutstanding?: number;
    npaCategory?: string;
    priority?: string;
    assignedCollector?: string;
  }
): Promise<void> => {
  try {
    const collectionCase = await getCollectionCase(orgId, caseId);
    if (!collectionCase) throw new Error('Collection case not found');

    await db.collection('collections').doc(caseId).update({
      ...updates,
      updatedAt: new Date(),
    });

    // Audit log
    await db.collection('audit_logs').add({
      orgId,
      action: 'COLLECTION_CASE_UPDATED',
      targetId: caseId,
      detail: `Collection case updated`,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error updating collection case:', error);
    throw error;
  }
};

export const addCollectionAction = async (
  orgId: string,
  caseId: string,
  action: Omit<CollectionAction, 'date'>,
  notes?: string
): Promise<void> => {
  try {
    const collectionCase = await getCollectionCase(orgId, caseId);
    if (!collectionCase) throw new Error('Collection case not found');

    const updatedActions = [
      ...collectionCase.actions,
      {
        ...action,
        date: new Date(),
        notes: notes || action.notes,
      }
    ];

    await db.collection('collections').doc(caseId).update({
      actions: updatedActions,
      lastCollectorUpdate: new Date(),
      updatedAt: new Date(),
    });

    // Audit log
    await db.collection('audit_logs').add({
      orgId,
      action: 'COLLECTION_ACTION_ADDED',
      targetId: caseId,
      detail: `Collection action recorded: ${action.type}`,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error adding collection action:', error);
    throw error;
  }
};

export const addRecoveryNote = async (
  orgId: string,
  caseId: string,
  note: string,
  collectorId?: string
): Promise<void> => {
  try {
    const collectionCase = await getCollectionCase(orgId, caseId);
    if (!collectionCase) throw new Error('Collection case not found');

    const updatedNotes = [
      ...collectionCase.recoveryNotes,
      `[${new Date().toISOString()}] ${note}${collectorId ? ` (by ${collectorId})` : ''}`
    ];

    await db.collection('collections').doc(caseId).update({
      recoveryNotes: updatedNotes,
      lastCollectorUpdate: new Date(),
      updatedAt: new Date(),
    });

    // Audit log
    await db.collection('audit_logs').add({
      orgId,
      action: 'RECOVERY_NOTE_ADDED',
      targetId: caseId,
      detail: `Recovery note added`,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error adding recovery note:', error);
    throw error;
  }
};

export const markLoanNPA = async (
  orgId: string,
  loanId: string,
  daysOverdue: number
): Promise<string> => {
  try {
    // Check if collection case exists
    const collectionCase = await getCollectionCaseByLoanId(orgId, loanId);

    if (!collectionCase) {
      // Create new collection case
      const loanDoc = await db.collection('loans').doc(loanId).get();
      if (!loanDoc.exists) throw new Error('Loan not found');

      const loan = loanDoc.data()!;

      const newCase = {
        loanId,
        borrowerId: loan.borrowerId,
        borrowerName: loan.borrowerName,
        borrowerPhone: loan.borrowerPhone,
        borrowerEmail: loan.borrowerEmail,
        loanAmount: loan.loanAmount,
        loanDate: loan.createdAt,
        status: 'NPA' as CollectionStatus,
        daysOverdue,
        amountOutstanding: loan.outstandingAmount,
        lastEmiDueDate: loan.firstEmiDueDate,
        missedEmis: Math.ceil(daysOverdue / 30),
        reminders: [],
        actions: [],
        recoveryNotes: [],
        npaStartDate: new Date(),
        npaAge: daysOverdue,
        npaCategory: (daysOverdue > 90 ? '90+ DPD' : daysOverdue > 60 ? '60-90 DPD' : '30-60 DPD') as any,
        priority: 'High' as const,
      };

      return await createCollectionCase(orgId, newCase);
    } else {
      // Update existing case
      let npaCategory = '30-60 DPD';
      if (daysOverdue > 90) npaCategory = '90+ DPD';
      else if (daysOverdue > 60) npaCategory = '60-90 DPD';

      await updateCollectionCaseStatus(orgId, collectionCase.id!, {
        status: 'NPA',
        daysOverdue,
        npaCategory: npaCategory as any,
        priority: 'High',
      });

      return collectionCase.id!;
    }
  } catch (error) {
    console.error('Error marking loan NPA:', error);
    throw error;
  }
};

export const getCollectionMetrics = async (orgId: string) => {
  try {
    const cases = await listCollectionCases(orgId, { limit: 10000 });

    const metrics = {
      totalCases: cases.length,
      byStatus: {
        current: cases.filter(c => c.status === 'Current').length,
        overdue: cases.filter(c => c.status === 'Overdue').length,
        npa: cases.filter(c => c.status === 'NPA').length,
        closed: cases.filter(c => c.status === 'Closed').length,
      },
      byNpaCategory: {
        '30-60 DPD': cases.filter(c => c.npaCategory === '30-60 DPD').length,
        '60-90 DPD': cases.filter(c => c.npaCategory === '60-90 DPD').length,
        '90+ DPD': cases.filter(c => c.npaCategory === '90+ DPD').length,
      },
      totalOutstanding: cases.reduce((sum, c) => sum + c.amountOutstanding, 0),
      npaRatio: cases.length > 0 ? (cases.filter(c => c.status === 'NPA').length / cases.length) * 100 : 0,
      avgDaysOverdue: cases.length > 0 ? Math.round(cases.reduce((sum, c) => sum + c.daysOverdue, 0) / cases.length) : 0,
    };

    return metrics;
  } catch (error) {
    console.error('Error calculating collection metrics:', error);
    throw error;
  }
};
