import { db, Timestamp } from '../config/firebase';

export interface Partner {
  id: string;
  orgId: string;
  companyName: string;
  legalName: string;
  registeredAddress: string;
  city: string;
  state: string;
  pincode: string;
  website?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  gstin?: string;
  pan: string;
  cin?: string;
  rbiLicense?: string;
  licenseType: 'NBFC' | 'Bank' | 'HFC' | 'Microfinance' | 'Other';
  lendingExperience: number;
  loanPortfolioSize?: string;
  targetLoanTypes: string[];
  monthlyVolumeTarget?: number;
  preferredTenor: string;
  targetInterestRate?: string;
  status: 'lead' | 'contacted' | 'qualified' | 'onboarding' | 'active' | 'suspended' | 'churned';
  source: 'inbound' | 'outbound' | 'referral' | 'partner' | 'event';
  assignedTo: string;
  dealValue: number;
  winProbability: number;
  expectedCloseDate?: Date;
  signedDate?: Date;
  monthlySubscription?: number;
  apiKeyGeneratedAt?: Date;
  onboardingCompletedAt?: Date;
  notes: string;
  activities: PartnerActivity[];
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt?: Date;
}

export interface PartnerActivity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'demo' | 'proposal' | 'contract' | 'note';
  date: Date;
  note: string;
  outcome: 'positive' | 'neutral' | 'negative';
  actor: string;
}

export interface CommissionRule {
  id: string;
  orgId: string;
  name: string;
  type: 'recurring' | 'one-time' | 'milestone';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  minDealValue: number;
  maxDealValue?: number;
  commissionPercent: number;
  flatCommission?: number;
  milestoneTrigger?: string;
  milestoneCommission?: number;
  payoutMonth: 'immediate' | '30days' | '90days' | 'on-renewal';
  active: boolean;
  createdAt: Date;
}

export interface CommissionPayment {
  id: string;
  orgId: string;
  partnerId: string;
  partnerName: string;
  dealId?: string;
  salesRep?: string;
  commissionRuleId?: string;
  dealValue: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  payableMonth: string;
  paidAt?: Date;
  paidVia?: string;
  transactionRef?: string;
  notes?: string;
  createdAt: Date;
}

export interface SalesLead {
  id: string;
  orgId: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  city?: string;
  source: 'inbound' | 'outbound' | 'referral' | 'event' | 'cold';
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'disqualified';
  score: number;
  assignedTo?: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== PARTNER MANAGEMENT ====================

export async function createPartner(
  orgId: string,
  data: Omit<Partner, 'id' | 'orgId' | 'createdAt' | 'updatedAt' | 'status' | 'activities'>
): Promise<string> {
  const partnerId = `partner_${Date.now()}`;

  await db.collection('partners').doc(partnerId).set({
    id: partnerId,
    orgId,
    ...data,
    status: 'lead',
    activities: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  await db.collection('audit_logs').add({
    orgId,
    action: 'PARTNER_CREATED',
    targetId: partnerId,
    detail: `Partner lead created: ${data.companyName}`,
    timestamp: Timestamp.now(),
  });

  return partnerId;
}

export async function getPartners(
  orgId: string,
  filter?: { status?: string; assignedTo?: string }
): Promise<Partner[]> {
  let query: any = db.collection('partners').where('orgId', '==', orgId);

  if (filter?.status && filter.status !== 'all') {
    query = query.where('status', '==', filter.status);
  }
  if (filter?.assignedTo) {
    query = query.where('assignedTo', '==', filter.assignedTo);
  }

  const snapshot = await query.orderBy('updatedAt', 'desc').get();

  return snapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
      expectedCloseDate: data.expectedCloseDate?.toDate?.(),
      signedDate: data.signedDate?.toDate?.(),
      onboardingCompletedAt: data.onboardingCompletedAt?.toDate?.(),
      activities: (data.activities || []).map((a: any) => ({
        ...a,
        date: a.date?.toDate?.() || new Date(a.date),
      })),
    } as Partner;
  });
}

export async function getPartner(orgId: string, partnerId: string): Promise<Partner | null> {
  const doc = await db.collection('partners').doc(partnerId).get();
  if (!doc.exists || doc.data()!.orgId !== orgId) return null;

  const data = doc.data()!;
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
    expectedCloseDate: data.expectedCloseDate?.toDate?.(),
    signedDate: data.signedDate?.toDate?.(),
    onboardingCompletedAt: data.onboardingCompletedAt?.toDate?.(),
    activities: (data.activities || []).map((a: any) => ({
      ...a,
      date: a.date?.toDate?.() || new Date(a.date),
    })),
  } as Partner;
}

export async function updatePartner(
  orgId: string,
  partnerId: string,
  updates: Partial<Partner>
): Promise<void> {
  const updateData: any = { ...updates, updatedAt: Timestamp.now(), lastActivityAt: Timestamp.now() };

  if (updates.expectedCloseDate) {
    updateData.expectedCloseDate = Timestamp.fromDate(new Date(updates.expectedCloseDate));
  }
  if (updates.signedDate) {
    updateData.signedDate = Timestamp.fromDate(new Date(updates.signedDate));
  }

  await db.collection('partners').doc(partnerId).update(updateData);

  await db.collection('audit_logs').add({
    orgId,
    action: 'PARTNER_UPDATED',
    targetId: partnerId,
    detail: `Partner updated: ${Object.keys(updates).join(', ')}`,
    timestamp: Timestamp.now(),
  });
}

export async function addPartnerActivity(
  orgId: string,
  partnerId: string,
  activity: Omit<PartnerActivity, 'id' | 'date'>
): Promise<void> {
  const activityId = `act_${Date.now()}`;
  const fullActivity = {
    id: activityId,
    ...activity,
    date: Timestamp.now(),
  };

  const partner = await getPartner(orgId, partnerId);
  if (!partner) throw new Error('Partner not found');

  const activities = [...(partner.activities || []), fullActivity];

  await db.collection('partners').doc(partnerId).update({
    activities,
    lastActivityAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function movePartnerStage(
  orgId: string,
  partnerId: string,
  newStatus: Partner['status'],
  notes?: string
): Promise<void> {
  const updateData: any = { status: newStatus, updatedAt: Timestamp.now(), lastActivityAt: Timestamp.now() };

  if (newStatus === 'active') {
    updateData.onboardingCompletedAt = Timestamp.now();
    updateData.signedDate = Timestamp.now();
  }

  await db.collection('partners').doc(partnerId).update(updateData);

  if (notes) {
    await addPartnerActivity(orgId, partnerId, {
      type: 'note',
      note: `Stage moved to ${newStatus}${notes ? `: ${notes}` : ''}`,
      outcome: 'neutral',
      actor: 'system',
    });
  }

  await db.collection('audit_logs').add({
    orgId,
    action: `PARTNER_STAGE_${newStatus.toUpperCase()}`,
    targetId: partnerId,
    detail: `Partner stage: ${newStatus}`,
    timestamp: Timestamp.now(),
  });
}

export async function getPartnerMetrics(orgId: string): Promise<{
  total: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  pipelineValue: number;
  expectedMonthlyRevenue: number;
  activePartners: number;
  avgTimeToClose: number;
  conversionRate: number;
}> {
  const partners = await getPartners(orgId);

  const byStatus: Record<string, number> = {};
  const bySource: Record<string, number> = {};

  partners.forEach(p => {
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    bySource[p.source] = (bySource[p.source] || 0) + 1;
  });

  const active = partners.filter(p => p.status === 'active');
  const signed = partners.filter(p => ['active', 'suspended'].includes(p.status));
  const converted = partners.filter(p => p.status !== 'lead');

  const pipelineValue = partners
    .filter(p => ['contacted', 'qualified', 'onboarding'].includes(p.status))
    .reduce((sum, p) => sum + p.dealValue * (p.winProbability / 100), 0);

  const expectedMonthlyRevenue = active.reduce((sum, p) => sum + (p.monthlySubscription || 0), 0);

  const closedDeals = partners.filter(p => p.signedDate);
  const avgTimeToClose = closedDeals.length > 0
    ? closedDeals.reduce((sum, p) => {
        const created = new Date(p.createdAt).getTime();
        const closed = new Date(p.signedDate!).getTime();
        return sum + (closed - created) / (1000 * 60 * 60 * 24);
      }, 0) / closedDeals.length
    : 0;

  const conversionRate = partners.length > 0
    ? (converted.length / partners.length) * 100
    : 0;

  return {
    total: partners.length,
    byStatus,
    bySource,
    pipelineValue: Math.round(pipelineValue),
    expectedMonthlyRevenue: Math.round(expectedMonthlyRevenue),
    activePartners: active.length,
    avgTimeToClose: Math.round(avgTimeToClose),
    conversionRate: Math.round(conversionRate),
  };
}

// ==================== COMMISSION MANAGEMENT ====================

export async function createCommissionRule(
  orgId: string,
  rule: Omit<CommissionRule, 'id' | 'orgId' | 'createdAt'>
): Promise<string> {
  const ruleId = `commrule_${Date.now()}`;

  await db.collection('commission_rules').doc(ruleId).set({
    id: ruleId,
    orgId,
    ...rule,
    createdAt: Timestamp.now(),
  });

  return ruleId;
}

export async function getCommissionRules(orgId: string): Promise<CommissionRule[]> {
  const snapshot = await db.collection('commission_rules')
    .where('orgId', '==', orgId)
    .where('active', '==', true)
    .get();

  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as CommissionRule));
}

export async function calculateCommission(
  orgId: string,
  dealValue: number,
  tier: string
): Promise<{ ruleId: string; amount: number; type: string } | null> {
  const rules = await getCommissionRules(orgId);

  const matchingRule = rules.find(r =>
    r.tier === tier &&
    dealValue >= r.minDealValue &&
    (!r.maxDealValue || dealValue <= r.maxDealValue)
  );

  if (!matchingRule) {
    const fallbackRule = rules.find(r => r.type === 'one-time' && dealValue >= r.minDealValue);
    if (!fallbackRule) return null;
    const amount = fallbackRule.flatCommission
      || (dealValue * fallbackRule.commissionPercent / 100);
    return {
      ruleId: fallbackRule.id,
      amount: Math.round(amount),
      type: fallbackRule.type,
    };
  }

  const amount = matchingRule.flatCommission
    || (dealValue * matchingRule.commissionPercent / 100);

  return {
    ruleId: matchingRule.id,
    amount: Math.round(amount),
    type: matchingRule.type,
  };
}

export async function createCommissionPayment(
  orgId: string,
  payment: Omit<CommissionPayment, 'id' | 'orgId' | 'createdAt'>
): Promise<string> {
  const paymentId = `comp_${Date.now()}`;

  await db.collection('commission_payments').doc(paymentId).set({
    id: paymentId,
    orgId,
    ...payment,
    createdAt: Timestamp.now(),
  });

  return paymentId;
}

export async function getCommissionPayments(
  orgId: string,
  filter?: { status?: string; partnerId?: string }
): Promise<CommissionPayment[]> {
  let query: any = db.collection('commission_payments').where('orgId', '==', orgId);

  if (filter?.status && filter.status !== 'all') {
    query = query.where('status', '==', filter.status);
  }
  if (filter?.partnerId) {
    query = query.where('partnerId', '==', filter.partnerId);
  }

  const snapshot = await query.orderBy('createdAt', 'desc').get();

  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
    paidAt: doc.data().paidAt?.toDate?.(),
    createdAt: doc.data().createdAt?.toDate?.(),
  } as CommissionPayment));
}

export async function approveCommissionPayment(
  orgId: string,
  paymentId: string
): Promise<void> {
  await db.collection('commission_payments').doc(paymentId).update({
    status: 'approved',
    updatedAt: Timestamp.now(),
  });
}

export async function markCommissionPaid(
  orgId: string,
  paymentId: string,
  transactionRef: string
): Promise<void> {
  await db.collection('commission_payments').doc(paymentId).update({
    status: 'paid',
    paidAt: Timestamp.now(),
    transactionRef,
    updatedAt: Timestamp.now(),
  });
}

export async function getCommissionSummary(orgId: string): Promise<{
  pending: number;
  approved: number;
  paid: number;
  total: number;
  byPartner: Record<string, number>;
  bySalesRep: Record<string, number>;
}> {
  const payments = await getCommissionPayments(orgId);

  const pending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.commissionAmount, 0);
  const approved = payments.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.commissionAmount, 0);
  const paid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.commissionAmount, 0);

  const byPartner: Record<string, number> = {};
  const bySalesRep: Record<string, number> = {};

  payments.forEach(p => {
    if (p.status === 'paid') {
      byPartner[p.partnerId] = (byPartner[p.partnerId] || 0) + p.commissionAmount;
      if (p.salesRep) {
        bySalesRep[p.salesRep] = (bySalesRep[p.salesRep] || 0) + p.commissionAmount;
      }
    }
  });

  return { pending, approved, paid, total: pending + approved + paid, byPartner, bySalesRep };
}

// ==================== SALES LEADS ====================

export async function createSalesLead(
  orgId: string,
  data: Omit<SalesLead, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const leadId = `lead_${Date.now()}`;

  await db.collection('sales_leads').doc(leadId).set({
    id: leadId,
    orgId,
    ...data,
    score: data.score || 50,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return leadId;
}

export async function getSalesLeads(
  orgId: string,
  filter?: { status?: string; assignedTo?: string }
): Promise<SalesLead[]> {
  let query: any = db.collection('sales_leads').where('orgId', '==', orgId);

  if (filter?.status && filter.status !== 'all') {
    query = query.where('status', '==', filter.status);
  }
  if (filter?.assignedTo) {
    query = query.where('assignedTo', '==', filter.assignedTo);
  }

  const snapshot = await query.orderBy('createdAt', 'desc').get();

  return snapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    } as SalesLead;
  });
}

export async function updateLeadScore(orgId: string, leadId: string, score: number): Promise<void> {
  await db.collection('sales_leads').doc(leadId).update({
    score,
    updatedAt: Timestamp.now(),
  });
}

export async function convertLeadToPartner(
  orgId: string,
  leadId: string,
  partnerData: Partial<Partner>
): Promise<string> {
  const lead = await db.collection('sales_leads').doc(leadId).get();
  if (!lead.exists) throw new Error('Lead not found');

  const leadData = lead.data()!;

  const partnerId = await createPartner(orgId, {
    companyName: leadData.companyName,
    legalName: leadData.companyName,
    registeredAddress: '',
    city: leadData.city || '',
    state: '',
    pincode: '',
    contactName: leadData.contactName,
    contactEmail: leadData.contactEmail,
    contactPhone: leadData.contactPhone,
    website: leadData.website,
    pan: '',
    licenseType: 'NBFC',
    lendingExperience: 0,
    targetLoanTypes: [],
    preferredTenor: '12',
    source: leadData.source as any,
    assignedTo: leadData.assignedTo || '',
    dealValue: 0,
    winProbability: 50,
    notes: `Converted from lead ${leadId}`,
  });

  await db.collection('sales_leads').doc(leadId).update({
    status: 'converted',
    partnerId,
    updatedAt: Timestamp.now(),
  });

  return partnerId;
}