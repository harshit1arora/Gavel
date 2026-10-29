import { db } from '../config/firebase';

export type AssetClassification = 'Standard' | 'SMA-0' | 'SMA-1' | 'SMA-2' | 'NPA';
export type NPACategory = 'Substandard' | 'Doubtful' | 'Loss Asset';

export interface LoanAssetClassification {
  loanId: string;
  orgId: string;
  classification: AssetClassification;
  classificationDate: Date;
  npaCategory?: NPACategory;
  npaDate?: Date;
  npaAge?: number;
  daysOverdue: number;
  overdueAmount: number;
  totalOutstanding: number;
  overdueEMICount: number;
  lastPaymentDate?: Date;
  lastEMIDueDate?: Date;
  restructuredDate?: Date;
  provisioningRequired: number;
  provisioningRate: number;
  securityValue?: number;
  guaranteedAmount?: number;
  expectedLoss?: number;
  bestViewRecovery?: number;
  worstViewRecovery?: number;
  updatedAt: Date;
}

interface LoanInfo {
  id: string;
  orgId: string;
  borrowerId: string;
  borrowerName: string;
  loanAmount: number;
  outstandingAmount: number;
  emiAmount: number;
  firstEmiDate: Date;
  lastEmiDate?: Date;
  rate: number;
  tenor: number;
  status: string;
  lastPaymentDate?: Date;
  securityValue?: number;
  guaranteedAmount?: number;
}

const SMA_THRESHOLDS = {
  'SMA-0': 1,
  'SMA-1': 31,
  'SMA-2': 61,
  'NPA': 91,
};

export const calculateDPD = (lastEMIDueDate: Date): number => {
  const today = new Date();
  const diffMs = today.getTime() - new Date(lastEMIDueDate).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
};

export const classifyAsset = (daysOverdue: number): AssetClassification => {
  if (daysOverdue >= SMA_THRESHOLDS['NPA']) return 'NPA';
  if (daysOverdue >= SMA_THRESHOLDS['SMA-2']) return 'SMA-2';
  if (daysOverdue >= SMA_THRESHOLDS['SMA-1']) return 'SMA-1';
  if (daysOverdue >= SMA_THRESHOLDS['SMA-0']) return 'SMA-0';
  return 'Standard';
};

export const getNPACategory = (npaAge: number): NPACategory => {
  if (npaAge <= 12) return 'Substandard';
  if (npaAge <= 24) return 'Doubtful';
  return 'Loss Asset';
};

/**
 * Provisioning rates per RBI IRAC norms.
 *
 * Standard and SMA buckets carry no RBI-mandated rate; the small numbers here
 * are the prudent floors most NBFCs hold internally. NPA rates are the RBI
 * minimums: substandard 15%, doubtful 25% up to one year, 40% for one to three
 * years, 100% beyond that, and loss assets 100%.
 *
 * `npaAge` is in months.
 */
export const getProvisioningRate = (
  classification: AssetClassification,
  npaCategory?: NPACategory,
  npaAge?: number
): number => {
  switch (classification) {
    case 'Standard': return 0;
    case 'SMA-0': return 0.5;
    case 'SMA-1': return 1;
    case 'SMA-2': return 5;
    case 'NPA': {
      const category = npaCategory ?? getNPACategory(npaAge ?? 0);
      if (category === 'Loss Asset') return 100;
      if (category === 'Substandard') return 15;
      // Doubtful: age banded
      if (npaAge === undefined) return 25;
      if (npaAge <= 12) return 25;
      if (npaAge <= 36) return 40;
      return 100;
    }
    default: return 0;
  }
};

export const calculateECL = (
  outstandingAmount: number,
  probabilityOfDefault: number,
  lossGivenDefault: number,
  exposureAtDefault: number
): number => {
  const EAD = exposureAtDefault;
  const PD = probabilityOfDefault;
  const LGD = lossGivenDefault;
  return Math.round(EAD * PD / 100 * LGD / 100);
};

export const calculateExpectedLoss = (
  outstanding: number,
  classification: AssetClassification,
  npaAge?: number,
  securityValue?: number
): { el: number; provision: number; rate: number } => {
  let pd: number;
  let lgd: number;

  switch (classification) {
    case 'Standard':
      pd = 2;
      lgd = 50;
      break;
    case 'SMA-0':
      pd = 5;
      lgd = 50;
      break;
    case 'SMA-1':
      pd = 15;
      lgd = 50;
      break;
    case 'SMA-2':
      pd = 30;
      lgd = 50;
      break;
    case 'NPA':
      if (npaAge !== undefined) {
        if (npaAge <= 12) { pd = 50; lgd = 75; }
        else if (npaAge <= 24) { pd = 75; lgd = 100; }
        else { pd = 100; lgd = 100; }
      } else {
        pd = 50;
        lgd = 75;
      }
      break;
    default:
      pd = 2;
      lgd = 50;
  }

  // pd and lgd are both percentages here.
  const el = Math.round((outstanding * (pd / 100) * lgd) / 100);
  const rate = (pd * lgd) / 100;

  // Provision is the higher of the expected loss and the RBI IRAC floor. A model
  // that is more optimistic than the regulation is not usable by a lender.
  const rbiFloorRate = getProvisioningRate(
    classification,
    classification === 'NPA' ? getNPACategory(npaAge ?? 0) : undefined,
    npaAge
  );
  // RBI IRAC provisions nothing for a standard asset; expected loss is reported
  // separately for IFRS9-style views.
  const modelProvision = classification === 'Standard' ? 0 : el;
  const provision = Math.max(modelProvision, Math.round((outstanding * rbiFloorRate) / 100));

  if (securityValue && securityValue > 0) {
    const unsecured = Math.max(0, outstanding - securityValue);
    const securedContribution = Math.min(el, Math.round(securityValue * 0.1));
    return { el: Math.max(securedContribution, el - Math.round(unsecured * pd / 100)), provision, rate };
  }

  return { el, provision, rate };
};

export const classifyLoanAsset = async (
  loan: LoanInfo,
  scheduleItems?: Array<{ emiNo: number; dueDate: Date; status: string; emiAmount: number }>
): Promise<LoanAssetClassification> => {
  let daysOverdue = 0;
  let overdueAmount = 0;
  let overdueEMICount = 0;
  let lastEMIDueDate: Date | undefined;
  let lastPaymentDate: Date | undefined;

  if (scheduleItems) {
    const overdueItems = scheduleItems.filter(s => s.status === 'Overdue' || 
      (s.status === 'Pending' && new Date(s.dueDate) < new Date()));
    
    overdueEMICount = overdueItems.length;
    
    if (overdueItems.length > 0) {
      const latest = overdueItems[overdueItems.length - 1];
      lastEMIDueDate = new Date(latest.dueDate);
      daysOverdue = calculateDPD(lastEMIDueDate);
      
      const paidItems = scheduleItems.filter(s => s.status === 'Paid');
      if (paidItems.length > 0) {
        const latestPaid = paidItems[paidItems.length - 1];
        lastPaymentDate = new Date((latestPaid as any).paidDate || latestPaid.dueDate);
      }
    } else {
      const pendingItems = scheduleItems.filter(s => s.status === 'Pending');
      if (pendingItems.length > 0) {
        const earliestPending = pendingItems[0];
        lastEMIDueDate = new Date(earliestPending.dueDate);
        const diff = calculateDPD(lastEMIDueDate);
        if (diff > 0) {
          daysOverdue = diff;
          overdueEMICount = 1;
          overdueAmount = earliestPending.emiAmount;
        }
      }
    }

    overdueAmount = overdueItems.reduce((sum, item) => sum + item.emiAmount, 0);
  } else {
    const daysSinceFirstEMI = loan.firstEmiDate 
      ? calculateDPD(new Date(loan.firstEmiDate))
      : 0;
    
    const scheduledEMIs = Math.floor(daysSinceFirstEMI / 30);
    const paidEMIs = loan.lastPaymentDate 
      ? Math.floor(calculateDPD(new Date(loan.lastPaymentDate)) / 30)
      : 0;
    
    overdueEMICount = Math.max(0, scheduledEMIs - paidEMIs);
    daysOverdue = overdueEMICount > 0 ? (scheduledEMIs - paidEMIs) * 30 : 0;
    overdueAmount = overdueEMICount * loan.emiAmount;
    
    if (loan.lastPaymentDate) {
      lastPaymentDate = new Date(loan.lastPaymentDate);
    }
  }

  const classification = classifyAsset(daysOverdue);
  let npaCategory: NPACategory | undefined;
  let npaDate: Date | undefined;
  let npaAge: number | undefined;

  if (classification === 'NPA') {
    const npaStartDate = new Date();
    npaDate = npaStartDate;
    npaAge = 0;
    npaCategory = getNPACategory(0);
  }

  const { el, provision, rate } = calculateExpectedLoss(
    loan.outstandingAmount || loan.loanAmount,
    classification,
    npaAge,
    loan.securityValue
  );

  return {
    loanId: loan.id,
    orgId: loan.orgId,
    classification,
    classificationDate: new Date(),
    npaCategory,
    npaDate,
    npaAge,
    daysOverdue,
    overdueAmount,
    totalOutstanding: loan.outstandingAmount || loan.loanAmount,
    overdueEMICount,
    lastPaymentDate,
    lastEMIDueDate,
    provisioningRequired: provision,
    provisioningRate: rate,
    securityValue: loan.securityValue,
    guaranteedAmount: loan.guaranteedAmount,
    expectedLoss: el,
    bestViewRecovery: loan.securityValue ? Math.round(loan.securityValue * 0.7) : 0,
    worstViewRecovery: loan.securityValue ? Math.round(loan.securityValue * 0.3) : 0,
    updatedAt: new Date(),
  };
};

export const updateLoanClassification = async (
  orgId: string,
  loanId: string,
  classification: LoanAssetClassification
): Promise<void> => {
  await db.collection('loan_classifications').doc(`${orgId}_${loanId}`).set({
    ...classification,
    updatedAt: new Date(),
  }, { merge: true });

  await db.collection('audit_logs').add({
    orgId,
    action: 'LOAN_CLASSIFICATION_UPDATED',
    targetId: loanId,
    detail: `Asset classified as ${classification.classification}, DPD: ${classification.daysOverdue}`,
    timestamp: new Date(),
  });
};

export const getLoanClassification = async (
  orgId: string,
  loanId: string
): Promise<LoanAssetClassification | null> => {
  const doc = await db.collection('loan_classifications').doc(`${orgId}_${loanId}`).get();
  return doc.exists ? doc.data() as LoanAssetClassification : null;
};

export const getPortfolioClassificationSummary = async (
  orgId: string
): Promise<{
  total: number;
  standard: number;
  sma0: number;
  sma1: number;
  sma2: number;
  npa: number;
  npaByCategory: Record<NPACategory, number>;
  totalOutstanding: number;
  totalOverdue: number;
  totalProvisioning: number;
  npaRatio: number;
  provisionCoverage: number;
  averageDPD: number;
}> => {
  const snapshot = await db.collection('loan_classifications')
    .where('orgId', '==', orgId)
    .get();

  const classifications = snapshot.docs.map(d => d.data() as LoanAssetClassification);

  const total = classifications.length;
  const standard = classifications.filter(c => c.classification === 'Standard').length;
  const sma0 = classifications.filter(c => c.classification === 'SMA-0').length;
  const sma1 = classifications.filter(c => c.classification === 'SMA-1').length;
  const sma2 = classifications.filter(c => c.classification === 'SMA-2').length;
  const npa = classifications.filter(c => c.classification === 'NPA').length;

  const npaClassifications = classifications.filter(c => c.classification === 'NPA');
  const npaByCategory: Record<NPACategory, number> = {
    'Substandard': npaClassifications.filter(c => c.npaCategory === 'Substandard').length,
    'Doubtful': npaClassifications.filter(c => c.npaCategory === 'Doubtful').length,
    'Loss Asset': npaClassifications.filter(c => c.npaCategory === 'Loss Asset').length,
  };

  const totalOutstanding = classifications.reduce((sum, c) => sum + c.totalOutstanding, 0);
  const totalOverdue = classifications.reduce((sum, c) => sum + c.overdueAmount, 0);
  const totalProvisioning = classifications.reduce((sum, c) => sum + c.provisioningRequired, 0);

  const npaRatio = total > 0 ? (npa / total) * 100 : 0;
  const provisionCoverage = totalOverdue > 0 ? (totalProvisioning / totalOverdue) * 100 : 0;
  const averageDPD = total > 0 
    ? Math.round(classifications.reduce((sum, c) => sum + c.daysOverdue, 0) / total)
    : 0;

  return {
    total,
    standard,
    sma0,
    sma1,
    sma2,
    npa,
    npaByCategory,
    totalOutstanding,
    totalOverdue,
    totalProvisioning,
    npaRatio,
    provisionCoverage,
    averageDPD,
  };
};

export const runPortfolioClassification = async (orgId?: string): Promise<{
  processed: number;
  classified: Record<string, number>;
}> => {
  const results: Record<string, number> = {
    'Standard': 0,
    'SMA-0': 0,
    'SMA-1': 0,
    'SMA-2': 0,
    'NPA': 0,
  };

  let query: any = db.collection('loans').where('status', '==', 'Active');
  
  if (orgId) {
    query = db.collection('loans').where('orgId', '==', orgId).where('status', '==', 'Active');
  }

  const snapshot = await query.get();

  for (const loanDoc of snapshot.docs) {
    const loan = loanDoc.data() as LoanInfo;
    loan.id = loanDoc.id;

    const scheduleSnapshot = await db.collection('repayment_schedules')
      .where('loanId', '==', loanDoc.id)
      .limit(1)
      .get();

    const schedule = scheduleSnapshot.empty ? null : scheduleSnapshot.docs[0].data();
const scheduleItems = schedule?.schedules as Array<{
      emiNo: number;
      dueDate: Date;
      status: string;
      emiAmount: number;
      paidDate?: Date;
    }> | undefined;

    const classification = await classifyLoanAsset(loan, scheduleItems);
    await updateLoanClassification(loan.orgId, loanDoc.id, classification);
    
    results[classification.classification]++;
  }

  console.log(`[Compliance] Portfolio classification complete:`, results);
  return { processed: snapshot.size, classified: results };
};

export const generateProvisioningReport = async (
  orgId: string
): Promise<{
  totalExposure: number;
  totalECL: number;
  totalProvisioning: number;
  provisionCoverage: number;
  stageWiseProvisioning: Record<string, number>;
  assetClassificationSummary: Record<string, { count: number; amount: number; provision: number }>;
  recommendedProvisions: Array<{
    loanId: string;
    borrowerName: string;
    classification: string;
    outstanding: number;
    provision: number;
    reason: string;
  }>;
}> => {
  const summary = await getPortfolioClassificationSummary(orgId);
  const snapshot = await db.collection('loan_classifications').where('orgId', '==', orgId).get();
  
  const classifications = snapshot.docs.map(d => d.data() as LoanAssetClassification);
  
  const stageWiseProvisioning: Record<string, number> = {
    'Standard': 0,
    'SMA-0': 0,
    'SMA-1': 0,
    'SMA-2': 0,
    'NPA-Substandard': 0,
    'NPA-Doubtful': 0,
    'NPA-Loss': 0,
  };

  const assetClassificationSummary: Record<string, { count: number; amount: number; provision: number }> = {};
  
  const recommendedProvisions: Array<{
    loanId: string;
    borrowerName: string;
    classification: string;
    outstanding: number;
    provision: number;
    reason: string;
  }> = [];

  for (const c of classifications) {
    const key = c.classification === 'NPA' 
      ? `NPA-${c.npaCategory}` 
      : c.classification;
    
    stageWiseProvisioning[key] += c.provisioningRequired;

    if (!assetClassificationSummary[c.classification]) {
      assetClassificationSummary[c.classification] = { count: 0, amount: 0, provision: 0 };
    }
    assetClassificationSummary[c.classification].count++;
    assetClassificationSummary[c.classification].amount += c.totalOutstanding;
    assetClassificationSummary[c.classification].provision += c.provisioningRequired;

    if (c.provisioningRequired > 0) {
      const loanSnapshot = await db.collection('loans').doc(c.loanId).get();
      const loan = loanSnapshot.data();
      recommendedProvisions.push({
        loanId: c.loanId,
        borrowerName: loan?.borrowerName || 'Unknown',
        classification: c.classification + (c.npaCategory ? ` (${c.npaCategory})` : ''),
        outstanding: c.totalOutstanding,
        provision: c.provisioningRequired,
        reason: c.classification === 'NPA' 
          ? `NPA classification, ${c.npaAge} days old` 
          : `${c.classification} - DPD ${c.daysOverdue} days`,
      });
    }
  }

  return {
    totalExposure: summary.totalOutstanding,
    totalECL: summary.totalOverdue,
    totalProvisioning: summary.totalProvisioning,
    provisionCoverage: summary.provisionCoverage,
    stageWiseProvisioning,
    assetClassificationSummary,
    recommendedProvisions: recommendedProvisions.sort((a, b) => b.provision - a.provision),
  };
};