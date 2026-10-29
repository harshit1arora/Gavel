import { db } from '../config/firebase';

export type LoanStatus = 'Created' | 'Approved' | 'DocumentSigned' | 'Disbursed' | 'Active' | 'Prepaid' | 'NPA' | 'Closed';
export type LoanStage = 'application' | 'approval' | 'docs_signed' | 'disbursed' | 'active' | 'prepaid' | 'npa' | 'closed';

export interface LoanTimeline {
  stage: LoanStage;
  timestamp: Date | string;
  actor?: string;
  notes?: string;
}

export interface Loan {
  id?: string;
  applicationId: string;
  disbursementId?: string;
  orgId: string;
  borrowerId: string;
  borrowerName: string;
  borrowerPhone: string;
  borrowerEmail: string;
  
  // Loan Details
  loanAmount: number;
  interestRate: number;
  tenor: number; // months
  productId: string;
  productName: string;
  segment: 'Micro' | 'Consumer' | 'MSME';
  
  // Status Tracking
  status: LoanStatus;
  currentStage: LoanStage;
  createdAt: Date | string;
  approvedAt?: Date | string;
  disbursedAt?: Date | string;
  closedAt?: Date | string;
  
  // Financial Tracking
  emiAmount: number;
  principalAmount: number;
  interestAmount: number;
  totalDisbursed: number;
  totalRepaid: number;
  outstandingAmount: number;
  
  // Dates
  firstEmiDueDate?: Date | string;
  lastEmiDueDate?: Date | string;
  
  // NPA Tracking
  daysOverdue?: number;
  npaStartDate?: Date | string;
  npaStatus?: 'Current' | 'Overdue' | 'NPA';
  
  // Timeline
  timeline: LoanTimeline[];
  
  // Metadata
  collateralType?: string;
  collateralValue?: number;
  coApplicants?: string[];
  customFields?: Record<string, any>;
}

export const createLoan = async (
  orgId: string,
  loan: Omit<Loan, 'id' | 'createdAt' | 'timeline'>
): Promise<string> => {
  try {
    const docRef = await db.collection('loans').add({
      ...loan,
      createdAt: new Date(),
      timeline: [
        {
          stage: 'application',
          timestamp: new Date(),
          notes: 'Loan record created from approved application'
        }
      ]
    });

    // Audit log
    await db.collection('audit_logs').add({
      orgId,
      action: 'LOAN_CREATED',
      targetId: docRef.id,
      detail: `Loan created for ${loan.borrowerName} - ₹${loan.loanAmount}`,
      timestamp: new Date()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating loan:', error);
    throw error;
  }
};

export const getLoan = async (
  orgId: string,
  loanId: string
): Promise<Loan | null> => {
  try {
    const doc = await db.collection('loans').doc(loanId).get();
    if (!doc.exists) return null;

    const data = doc.data()!;
    if (data.orgId !== orgId) return null;

    return { id: doc.id, ...data } as Loan;
  } catch (error) {
    console.error('Error getting loan:', error);
    throw error;
  }
};

export const listLoans = async (
  orgId: string,
  filter?: {
    status?: LoanStatus;
    segment?: string;
    riskTier?: string;
    npaStatus?: string;
    limit?: number;
  }
): Promise<Loan[]> => {
  try {
    let query: any = db.collection('loans').where('orgId', '==', orgId);

    if (filter?.status) {
      query = query.where('status', '==', filter.status);
    }
    if (filter?.segment) {
      query = query.where('segment', '==', filter.segment);
    }
    if (filter?.npaStatus) {
      query = query.where('npaStatus', '==', filter.npaStatus);
    }

    query = query.orderBy('createdAt', 'desc').limit(filter?.limit || 500);

    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Loan[];
  } catch (error) {
    console.error('Error listing loans:', error);
    throw error;
  }
};

export const getLoansByApplicationId = async (
  orgId: string,
  applicationId: string
): Promise<Loan | null> => {
  try {
    const snapshot = await db.collection('loans')
      .where('orgId', '==', orgId)
      .where('applicationId', '==', applicationId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Loan;
  } catch (error) {
    console.error('Error getting loan by application ID:', error);
    throw error;
  }
};

export const updateLoanStatus = async (
  orgId: string,
  loanId: string,
  newStatus: LoanStatus,
  newStage: LoanStage,
  notes?: string,
  actor?: string
): Promise<void> => {
  try {
    const loan = await getLoan(orgId, loanId);
    if (!loan) throw new Error('Loan not found');

    const updateData: any = {
      status: newStatus,
      currentStage: newStage,
      updatedAt: new Date(),
      timeline: [
        ...loan.timeline,
        {
          stage: newStage,
          timestamp: new Date(),
          actor,
          notes
        }
      ]
    };

    // Add stage-specific timestamps
    if (newStage === 'approval') updateData.approvedAt = new Date();
    if (newStage === 'disbursed') updateData.disbursedAt = new Date();
    if (newStage === 'closed') updateData.closedAt = new Date();

    await db.collection('loans').doc(loanId).update(updateData);

    // Audit log
    await db.collection('audit_logs').add({
      orgId,
      action: 'LOAN_STATUS_UPDATED',
      targetId: loanId,
      detail: `Loan status changed to ${newStatus}`,
      actor,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error updating loan status:', error);
    throw error;
  }
};

export const updateLoanNPAStatus = async (
  orgId: string,
  loanId: string,
  daysOverdue: number,
  npaStatus: 'Current' | 'Overdue' | 'NPA',
  npaStartDate?: Date
): Promise<void> => {
  try {
    const loan = await getLoan(orgId, loanId);
    if (!loan) throw new Error('Loan not found');

    const updateData: any = {
      daysOverdue,
      npaStatus,
      updatedAt: new Date()
    };

    if (npaStatus === 'NPA' && !loan.npaStartDate) {
      updateData.npaStartDate = npaStartDate || new Date();
      updateData.status = 'NPA';
      updateData.currentStage = 'npa';
    }

    await db.collection('loans').doc(loanId).update(updateData);

    // Audit log
    await db.collection('audit_logs').add({
      orgId,
      action: 'LOAN_NPA_UPDATED',
      targetId: loanId,
      detail: `Loan NPA status: ${npaStatus} (${daysOverdue} days overdue)`,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error updating NPA status:', error);
    throw error;
  }
};

export const updateLoanFinancials = async (
  orgId: string,
  loanId: string,
  totalRepaid: number,
  outstandingAmount: number
): Promise<void> => {
  try {
    const loan = await getLoan(orgId, loanId);
    if (!loan) throw new Error('Loan not found');

    const updateData: any = {
      totalRepaid,
      outstandingAmount,
      updatedAt: new Date()
    };

    // Mark as closed if fully repaid
    if (outstandingAmount <= 0) {
      updateData['status'] = 'Closed';
      updateData['currentStage'] = 'closed';
      updateData['closedAt'] = new Date();
    }

    await db.collection('loans').doc(loanId).update(updateData);

    // Audit log
    if (outstandingAmount <= 0) {
      await db.collection('audit_logs').add({
        orgId,
        action: 'LOAN_CLOSED',
        targetId: loanId,
        detail: 'Loan fully repaid and closed',
        timestamp: new Date()
      });
    }
  } catch (error) {
    console.error('Error updating loan financials:', error);
    throw error;
  }
};

export const linkDisbursementToLoan = async (
  orgId: string,
  loanId: string,
  disbursementId: string
): Promise<void> => {
  try {
    const loan = await getLoan(orgId, loanId);
    if (!loan) throw new Error('Loan not found');

    await db.collection('loans').doc(loanId).update({
      disbursementId,
      updatedAt: new Date()
    });

    await db.collection('audit_logs').add({
      orgId,
      action: 'LOAN_DISBURSEMENT_LINKED',
      targetId: loanId,
      detail: `Disbursement ${disbursementId} linked to loan`,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error linking disbursement to loan:', error);
    throw error;
  }
};

export const getLoanPortfolioMetrics = async (orgId: string) => {
  try {
    const loans = await listLoans(orgId, { limit: 10000 });

    const metrics = {
      totalLoans: loans.length,
      totalDisbursed: loans.reduce((sum, l) => sum + l.totalDisbursed, 0),
      totalRepaid: loans.reduce((sum, l) => sum + l.totalRepaid, 0),
      outstandingAmount: loans.reduce((sum, l) => sum + l.outstandingAmount, 0),
      byStatus: {
        active: loans.filter(l => l.status === 'Active').length,
        npa: loans.filter(l => l.status === 'NPA').length,
        closed: loans.filter(l => l.status === 'Closed').length,
        prepaid: loans.filter(l => l.status === 'Prepaid').length,
      },
      bySegment: {
        micro: loans.filter(l => l.segment === 'Micro').length,
        consumer: loans.filter(l => l.segment === 'Consumer').length,
        msme: loans.filter(l => l.segment === 'MSME').length,
      },
      npaRatio: loans.length > 0 ? (loans.filter(l => l.status === 'NPA').length / loans.length) * 100 : 0,
      avgLoanSize: loans.length > 0 ? loans.reduce((sum, l) => sum + l.loanAmount, 0) / loans.length : 0,
    };

    return metrics;
  } catch (error) {
    console.error('Error calculating portfolio metrics:', error);
    throw error;
  }
};
