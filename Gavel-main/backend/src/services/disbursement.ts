import { db } from '../config/firebase';
import { sendCommunication, listCommunicationTemplates } from './communications';

export interface ProofOfDisbursement {
  id: string;
  disbursementId: string;
  orgId: string;
  borrowerName: string;
  amount: number;
  method: string;
  referenceNumber?: string;
  issuedAt: Date | string;
  pdfUrl?: string;
}

export interface Tranche {
  id?: string;
  amount: number;
  dueDate: Date | string;
  status: 'Pending' | 'In Transit' | 'Completed' | 'Failed';
  disbursedDate?: Date | string;
  method: 'NEFT' | 'RTGS' | 'UPI' | 'Check' | 'Cash';
  rrn?: string;
  proofNote?: string;
}

export interface Disbursement {
  id?: string;
  loanId: string;
  applicationId: string;
  orgId: string;
  status: 'Pending' | 'In Transit' | 'Completed' | 'Failed' | 'Recalled';
  tranches: Tranche[];
  bankAccount?: string;
  borrowerUPI?: string;
  borrowerName?: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  totalAmount: number;
  createdAt: Date | string;
  updatedAt?: Date | string;
  auditTrail: Array<{
    action: string;
    actor?: string;
    timestamp: Date | string;
    notes?: string;
  }>;
}

export const createDisbursement = async (
  orgId: string,
  disbursement: Omit<Disbursement, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    const docRef = await db.collection('disbursements').add({
      ...disbursement,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating disbursement:', error);
    throw error;
  }
};

export const getDisbursement = async (orgId: string, disbursementId: string): Promise<Disbursement | null> => {
  try {
    const doc = await db.collection('disbursements').doc(disbursementId).get();
    if (!doc.exists) return null;

    const data = doc.data()!;
    // Verify orgId matches
    if (data.orgId !== orgId) return null;

    return { id: doc.id, ...data } as Disbursement;
  } catch (error) {
    console.error('Error getting disbursement:', error);
    throw error;
  }
};

export const listDisbursements = async (
  orgId: string,
  filter?: {
    status?: string;
    loanId?: string;
    limit?: number;
  }
): Promise<Disbursement[]> => {
  try {
    let query: any = db.collection('disbursements').where('orgId', '==', orgId);

    if (filter?.status) {
      query = query.where('status', '==', filter.status);
    }
    if (filter?.loanId) {
      query = query.where('loanId', '==', filter.loanId);
    }

    query = query.orderBy('createdAt', 'desc').limit(filter?.limit || 100);

    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Disbursement[];
  } catch (error) {
    console.error('Error listing disbursements:', error);
    throw error;
  }
};

export const updateDisbursementStatus = async (
  orgId: string,
  disbursementId: string,
  newStatus: Disbursement['status'],
  auditAction: string,
  actor?: string
): Promise<void> => {
  try {
    const disbursement = await getDisbursement(orgId, disbursementId);
    if (!disbursement) throw new Error('Disbursement not found');

    await db.collection('disbursements').doc(disbursementId).update({
      status: newStatus,
      updatedAt: new Date(),
      auditTrail: [
        ...disbursement.auditTrail,
        {
          action: auditAction,
          actor,
          timestamp: new Date(),
        }
      ]
    });

    // Log to audit_logs collection
    await db.collection('audit_logs').add({
      orgId,
      action: 'DISBURSEMENT_' + auditAction.toUpperCase().replace(/ /g, '_'),
      targetId: disbursementId,
      detail: `Disbursement status changed to ${newStatus}`,
      actor,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error updating disbursement status:', error);
    throw error;
  }
};

export const updateTrancheStatus = async (
  orgId: string,
  disbursementId: string,
  trancheId: string,
  newStatus: Tranche['status'],
  actor?: string
): Promise<void> => {
  try {
    const disbursement = await getDisbursement(orgId, disbursementId);
    if (!disbursement) throw new Error('Disbursement not found');

    const updatedTranches = disbursement.tranches.map(t =>
      t.id === trancheId ? { ...t, status: newStatus, disbursedDate: newStatus === 'Completed' ? new Date() : t.disbursedDate } : t
    );

    // Check if all tranches are completed
    const allCompleted = updatedTranches.every(t => t.status === 'Completed');

    await db.collection('disbursements').doc(disbursementId).update({
      tranches: updatedTranches,
      status: allCompleted ? 'Completed' : disbursement.status,
      updatedAt: new Date(),
      auditTrail: [
        ...disbursement.auditTrail,
        {
          action: `Tranche ${trancheId} marked as ${newStatus}`,
          actor,
          timestamp: new Date(),
        }
      ]
    });

    await db.collection('audit_logs').add({
      orgId,
      action: 'TRANCHE_UPDATED',
      targetId: disbursementId,
      detail: `Tranche ${trancheId} status changed to ${newStatus}`,
      actor,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error updating tranche status:', error);
    throw error;
  }
};

export const bulkCreateDisbursements = async (
  orgId: string,
  disbursements: Array<Omit<Disbursement, 'id' | 'createdAt' | 'orgId'>>
): Promise<string[]> => {
  try {
    const batch = db.batch();
    const ids: string[] = [];

    disbursements.forEach((disbursement) => {
      const docRef = db.collection('disbursements').doc();
      ids.push(docRef.id);
      batch.set(docRef, {
        ...disbursement,
        orgId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    await batch.commit();
    return ids;
  } catch (error) {
    console.error('Error bulk creating disbursements:', error);
    throw error;
  }
};

// Generate proof of disbursement
export const generateProofOfDisbursement = async (
  orgId: string,
  disbursementId: string,
  trancheId?: string
): Promise<ProofOfDisbursement> => {
  try {
    const disbursement = await getDisbursement(orgId, disbursementId);
    if (!disbursement) throw new Error('Disbursement not found');

    // Find the specific tranche if provided, otherwise use the latest completed one
    let tranche = null;
    if (trancheId) {
      tranche = disbursement.tranches.find(t => t.id === trancheId);
    } else {
      tranche = disbursement.tranches
        .filter(t => t.status === 'Completed')
        .sort((a, b) => new Date(b.disbursedDate || 0).getTime() - new Date(a.disbursedDate || 0).getTime())[0];
    }

    const amount = tranche?.amount || disbursement.totalAmount;
    const method = tranche?.method || 'Bank Transfer';
    const referenceNumber = tranche?.rrn || `POD-${Date.now()}`;

    const proof: ProofOfDisbursement = {
      id: `pod_${Date.now()}`,
      disbursementId,
      orgId,
      borrowerName: disbursement.borrowerName || 'Unknown',
      amount,
      method,
      referenceNumber,
      issuedAt: new Date(),
    };

    // Store proof in Firestore
    await db.collection('proofs_of_disbursement').add(proof);

    // Audit log
    await db.collection('audit_logs').add({
      orgId,
      action: 'PROOF_OF_DISBURSEMENT_GENERATED',
      targetId: disbursementId,
      detail: `Proof generated for amount ₹${amount}`,
      timestamp: new Date()
    });

    return proof;
  } catch (error) {
    console.error('Error generating proof of disbursement:', error);
    throw error;
  }
};

// Send disbursement confirmation communication
export const sendDisbursementConfirmation = async (
  orgId: string,
  disbursementId: string,
  channel: 'SMS' | 'Email' = 'SMS'
): Promise<{ success: boolean; logId?: string }> => {
  try {
    const disbursement = await getDisbursement(orgId, disbursementId);
    if (!disbursement) throw new Error('Disbursement not found');

    // Find or create "Disbursement Completed" template
    const templates = await listCommunicationTemplates(orgId, 'disbursement.completed');
    if (templates.length === 0) {
      // Use default template body
      const defaultBody = `Dear {borrowerName}, Rs.{amount} has been disbursed to your account. Ref: {referenceNumber}. Thank you for choosing Gavel Financial.`;
      // For MVP, we'll just log the message
      console.log(`[DISBURSEMENT_CONFIRMATION] To: ${disbursement.borrowerPhone || disbursement.borrowerEmail}, Message: ${defaultBody}`);
      return { success: true };
    }

    const template = templates[0];
    const placeholders = {
      borrowerName: disbursement.borrowerName || 'Borrower',
      amount: disbursement.totalAmount.toLocaleString('en-IN'),
      referenceNumber: disbursement.tranches.find(t => t.rrn)?.rrn || 'N/A',
    };

    const result = await sendCommunication(
      orgId,
      template.id!,
      {
        name: disbursement.borrowerName || 'Borrower',
        phone: disbursement.borrowerPhone,
        email: disbursement.borrowerEmail,
      },
      placeholders
    );

    return result;
  } catch (error) {
    console.error('Error sending disbursement confirmation:', error);
    throw error;
  }
};
