import { db } from '../config/firebase';
import { triggerCollectionWorkflow } from './collection-automation';

export interface RepaymentScheduleItem {
  emiNo: number;
  dueDate: Date | string;
  principalDue: number;
  interestDue: number;
  emiAmount: number;
  status: 'Pending' | 'Paid' | 'Overdue' | 'Waived';
  paidDate?: Date | string;
  paidAmount?: number;
  paidVia?: 'Online' | 'Check' | 'Cash' | 'NACH' | 'UPI';
  notes?: string;
}

export interface RepaymentSchedule {
  id?: string;
  loanId: string;
  orgId: string;
  borrowerId: string;
  borrowerName: string;
  loanAmount: number;
  rate: number;
  tenor: number;
  emiAmount: number;
  startDate: Date | string;
  firstEmiDate: Date | string;
  lastEmiDate?: Date | string;
  schedules: RepaymentScheduleItem[];
  totalScheduledAmount: number;
  totalPaid: number;
  totalOutstanding: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Calculate monthly EMI using standard formula:
 * EMI = P * r * (1+r)^n / ((1+r)^n - 1)
 */
export const calculateEMI = (
  principal: number,
  annualRate: number,
  tenorMonths: number
): number => {
  const monthlyRate = annualRate / 100 / 12;
  
  if (monthlyRate === 0) {
    return principal / tenorMonths;
  }

  const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, tenorMonths);
  const denominator = Math.pow(1 + monthlyRate, tenorMonths) - 1;
  
  return Math.round(numerator / denominator);
};

/**
 * Generate full amortization schedule
 */
export const generateRepaymentSchedule = (
  loanId: string,
  borrowerId: string,
  borrowerName: string,
  principal: number,
  annualRate: number,
  tenorMonths: number,
  startDate: Date
): RepaymentSchedule => {
  const emiAmount = calculateEMI(principal, annualRate, tenorMonths);
  const monthlyRate = annualRate / 100 / 12;
  
  let balance = principal;
  const schedules: RepaymentScheduleItem[] = [];
  
  const currentDate = new Date(startDate);
  currentDate.setMonth(currentDate.getMonth() + 1); // First EMI next month
  
  for (let i = 1; i <= tenorMonths; i++) {
    const interestDue = Math.round(balance * monthlyRate);
    const principalDue = Math.round(emiAmount - interestDue);
    
    // For last EMI, adjust for rounding
    let finalPrincipal = principalDue;
    if (i === tenorMonths) {
      finalPrincipal = balance;
    }
    
    const finalEMI = finalPrincipal + interestDue;
    
    schedules.push({
      emiNo: i,
      dueDate: new Date(currentDate),
      principalDue: finalPrincipal,
      interestDue: interestDue,
      emiAmount: finalEMI,
      status: 'Pending',
    });
    
    balance -= finalPrincipal;
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  const totalScheduledAmount = schedules.reduce((sum, s) => sum + s.emiAmount, 0);
  const lastEmiDate = schedules[schedules.length - 1].dueDate;

  return {
    loanId,
    orgId: '', // Will be set during save
    borrowerId,
    borrowerName,
    loanAmount: principal,
    rate: annualRate,
    tenor: tenorMonths,
    emiAmount,
    startDate,
    firstEmiDate: schedules[0].dueDate,
    lastEmiDate,
    schedules,
    totalScheduledAmount,
    totalPaid: 0,
    totalOutstanding: totalScheduledAmount,
    createdAt: new Date(),
  };
};

export const createRepaymentSchedule = async (
  orgId: string,
  schedule: Omit<RepaymentSchedule, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    const docRef = await db.collection('repayment_schedules').add({
      ...schedule,
      orgId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Audit log
    await db.collection('audit_logs').add({
      orgId,
      action: 'REPAYMENT_SCHEDULE_CREATED',
      targetId: docRef.id,
      detail: `Repayment schedule created for loan ${schedule.loanId}`,
      timestamp: new Date()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating repayment schedule:', error);
    throw error;
  }
};

export const getRepaymentScheduleByLoanId = async (
  orgId: string,
  loanId: string
): Promise<RepaymentSchedule | null> => {
  try {
    const snapshot = await db.collection('repayment_schedules')
      .where('orgId', '==', orgId)
      .where('loanId', '==', loanId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as RepaymentSchedule;
  } catch (error) {
    console.error('Error getting repayment schedule by loan ID:', error);
    throw error;
  }
};

export const recordRepayment = async (
  orgId: string,
  scheduleId: string,
  emiNo: number,
  amountPaid: number,
  paidVia: 'Online' | 'Check' | 'Cash' | 'NACH' | 'UPI',
  notes?: string
): Promise<void> => {
  try {
    const doc = await db.collection('repayment_schedules').doc(scheduleId).get();
    if (!doc.exists) throw new Error('Repayment schedule not found');

    const schedule = doc.data() as RepaymentSchedule;
    const emiIndex = emiNo - 1;
    if (emiIndex < 0 || emiIndex >= schedule.schedules.length) {
      throw new Error('Invalid EMI number');
    }

    const updatedSchedules = [...schedule.schedules];
    updatedSchedules[emiIndex] = {
      ...updatedSchedules[emiIndex],
      status: 'Paid',
      paidDate: new Date(),
      paidAmount: amountPaid,
      paidVia,
      notes,
    };

    // Recalculate totals
    const totalPaid = updatedSchedules
      .filter(s => s.status === 'Paid')
      .reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    
    const totalOutstanding = schedule.totalScheduledAmount - totalPaid;

    await db.collection('repayment_schedules').doc(scheduleId).update({
      schedules: updatedSchedules,
      totalPaid,
      totalOutstanding,
      updatedAt: new Date(),
    });

    // Audit log
    await db.collection('audit_logs').add({
      orgId,
      action: 'REPAYMENT_RECORDED',
      targetId: scheduleId,
      detail: `EMI #${emiNo} payment recorded: ₹${amountPaid}`,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error recording repayment:', error);
    throw error;
  }
};

export const markEMIOverdue = async (
  orgId: string,
  scheduleId: string,
  emiNo: number
): Promise<void> => {
  try {
    const doc = await db.collection('repayment_schedules').doc(scheduleId).get();
    if (!doc.exists) throw new Error('Repayment schedule not found');

    const schedule = doc.data() as RepaymentSchedule;
    const emiIndex = emiNo - 1;
    if (emiIndex < 0 || emiIndex >= schedule.schedules.length) {
      throw new Error('Invalid EMI number');
    }

    if (schedule.schedules[emiIndex].status === 'Pending') {
      const updatedSchedules = [...schedule.schedules];
      updatedSchedules[emiIndex].status = 'Overdue';

      await db.collection('repayment_schedules').doc(scheduleId).update({
        schedules: updatedSchedules,
        updatedAt: new Date(),
      });

      await db.collection('audit_logs').add({
        orgId,
        action: 'EMI_MARKED_OVERDUE',
        targetId: scheduleId,
        detail: `EMI #${emiNo} marked as overdue`,
        timestamp: new Date()
      });

      const overdueItems = updatedSchedules.filter(s => s.status === 'Overdue' ||
        (s.status === 'Pending' && new Date(s.dueDate) < new Date()));
      const missedEmis = overdueItems.length;
      const latestOverdue = overdueItems[overdueItems.length - 1];
      const daysOverdue = latestOverdue ? Math.max(1, Math.floor((Date.now() - new Date(latestOverdue.dueDate).getTime()) / (1000 * 60 * 60 * 24))) : 1;

      try {
        const loanInfo = {
          id: schedule.loanId,
          borrowerId: schedule.borrowerId,
          borrowerName: schedule.borrowerName,
          borrowerPhone: (schedule as any).borrowerPhone || '+919876543210',
          borrowerEmail: (schedule as any).borrowerEmail || 'borrower@example.com',
          loanAmount: schedule.loanAmount,
          outstandingAmount: schedule.totalOutstanding,
          firstEmiDueDate: new Date(schedule.firstEmiDate),
          emiAmount: schedule.emiAmount,
          orgId: schedule.orgId,
        };
        await triggerCollectionWorkflow(orgId, loanInfo, missedEmis, daysOverdue);
      } catch (colError) {
        console.error('Collection trigger failed:', colError);
      }
    }
  } catch (error) {
    console.error('Error marking EMI overdue:', error);
    throw error;
  }
};

export const getOverdueEMIs = async (
  orgId: string,
  loanId?: string
): Promise<Array<RepaymentSchedule & { overdueEMIs: RepaymentScheduleItem[] }>> => {
  try {
    let query: any = db.collection('repayment_schedules').where('orgId', '==', orgId);
    
    if (loanId) {
      query = query.where('loanId', '==', loanId);
    }

    const snapshot = await query.get();
    
    return snapshot.docs
      .map((doc: any) => {
        const data = doc.data() as RepaymentSchedule;
        const overdueEMIs = data.schedules.filter((s: any) => s.status === 'Overdue' || 
          (s.status === 'Pending' && new Date(s.dueDate) < new Date()));
        return {
          id: doc.id,
          ...data,
          overdueEMIs
        };
      })
      .filter((s: any) => s.overdueEMIs.length > 0);
  } catch (error) {
    console.error('Error getting overdue EMIs:', error);
    throw error;
  }
};
