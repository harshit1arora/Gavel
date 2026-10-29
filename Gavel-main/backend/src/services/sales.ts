import {
  db,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  collection,
  Timestamp,
  DocumentReference,
  doc,
} from '../config/firebase';

export interface SalesDeal {
  id?: string;
  orgId: string;
  prospectName: string;
  prospectCompany: string;
  prospectEmail: string;
  prospectPhone: string;
  stage: 'prospecting' | 'negotiating' | 'signed';
  valueEstimate: number; // Annual contract value in ₹
  winProbability: number; // 0-100
  expectedCloseDate: Date | string;
  notes: string;
  assignedTo: string; // Founder email or team member
  createdAt?: Date;
  updatedAt?: Date;
  lastActivityAt?: Date;
  deals?: SalesDeal[]; // For aggregated response
}

export interface SalesPipelineMetrics {
  totalProspects: number;
  totalNegotiating: number;
  totalSigned: number;
  pipelineValue: number; // Sum of value_estimate * win_probability for negotiating
  expectedMonthlyRevenue: number; // Sum of values for signed (annualized / 12)
  averageTimeToClose: number; // Days
  nextExpectedClose?: Date;
}

/**
 * Create a new sales deal
 */
export async function createSalesDeal(
  orgId: string,
  dealData: Omit<SalesDeal, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const dealId = `deal_${Date.now()}`;
    const dealsRef = collection(db, `organizations/${orgId}/sales_deals`);
    
    const dealDoc = {
      ...dealData,
      orgId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      expectedCloseDate: 
        dealData.expectedCloseDate instanceof Date 
          ? Timestamp.fromDate(dealData.expectedCloseDate)
          : Timestamp.fromDate(new Date(dealData.expectedCloseDate)),
    };

    await setDoc(doc(dealsRef, dealId), dealDoc);
    return dealId;
  } catch (error) {
    console.error('Error creating sales deal:', error);
    throw error;
  }
}

/**
 * Get all sales deals for an organization, grouped by stage
 */
export async function getSalesPipeline(orgId: string): Promise<{
  prospecting: SalesDeal[];
  negotiating: SalesDeal[];
  signed: SalesDeal[];
  metrics: SalesPipelineMetrics;
}> {
  try {
    const dealsRef = collection(db, `organizations/${orgId}/sales_deals`);
    const dealsSnapshot = await getDocs(
      query(dealsRef, orderBy('expectedCloseDate', 'asc'))
    );

    const deals: SalesDeal[] = [];
    dealsSnapshot.forEach((docSnap: any) => {
      const data = docSnap.data();
      deals.push({
        id: docSnap.id,
        ...data,
        expectedCloseDate: data.expectedCloseDate?.toDate?.() || new Date(data.expectedCloseDate),
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
      } as SalesDeal);
    });

    // Group by stage
    const prospecting = deals.filter((d) => d.stage === 'prospecting');
    const negotiating = deals.filter((d) => d.stage === 'negotiating');
    const signed = deals.filter((d) => d.stage === 'signed');

    // Calculate metrics
    const pipelineValue = negotiating.reduce(
      (sum, deal) => sum + deal.valueEstimate * (deal.winProbability / 100),
      0
    );
    const expectedMonthlyRevenue = signed.reduce(
      (sum, deal) => sum + deal.valueEstimate / 12,
      0
    );
    const closedDealsCount = deals.filter((d) => d.stage === 'signed').length;
    const totalDaysToClose = deals
      .filter((d) => d.stage === 'signed' && d.createdAt)
      .reduce((sum, d) => {
        const createdDate = new Date(d.createdAt!).getTime();
        const closedDate = new Date(d.updatedAt!).getTime();
        return sum + (closedDate - createdDate) / (1000 * 60 * 60 * 24);
      }, 0);
    const averageTimeToClose = closedDealsCount > 0 ? totalDaysToClose / closedDealsCount : 0;

    const nextClose = deals
      .filter((d) => d.stage !== 'signed')
      .map((d) => new Date(d.expectedCloseDate))
      .sort((a, b) => a.getTime() - b.getTime())[0];

    const metrics: SalesPipelineMetrics = {
      totalProspects: prospecting.length,
      totalNegotiating: negotiating.length,
      totalSigned: signed.length,
      pipelineValue: Math.round(pipelineValue),
      expectedMonthlyRevenue: Math.round(expectedMonthlyRevenue),
      averageTimeToClose: Math.round(averageTimeToClose * 10) / 10,
      nextExpectedClose: nextClose,
    };

    return { prospecting, negotiating, signed, metrics };
  } catch (error) {
    console.error('Error getting sales pipeline:', error);
    throw error;
  }
}

/**
 * Get a single deal
 */
export async function getSalesDeal(orgId: string, dealId: string): Promise<SalesDeal | null> {
  try {
    const dealRef = doc(db, `organizations/${orgId}/sales_deals/${dealId}`);
    const dealSnap = await getDoc(dealRef);

    if (!dealSnap.exists()) {
      return null;
    }

    const data = dealSnap.data();
    return {
      id: dealSnap.id,
      ...data,
      expectedCloseDate: data.expectedCloseDate?.toDate?.() || new Date(data.expectedCloseDate),
      createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
    } as SalesDeal;
  } catch (error) {
    console.error('Error getting sales deal:', error);
    throw error;
  }
}

/**
 * Update a sales deal (move between stages, update probability, etc)
 */
export async function updateSalesDeal(
  orgId: string,
  dealId: string,
  updates: Partial<SalesDeal>
): Promise<void> {
  try {
    const dealRef = doc(db, `organizations/${orgId}/sales_deals/${dealId}`);
    
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
      lastActivityAt: Timestamp.now(),
    };

    // Convert dates to timestamps
    if (updates.expectedCloseDate) {
      const dateVal = updates.expectedCloseDate instanceof Date 
        ? updates.expectedCloseDate 
        : new Date(updates.expectedCloseDate);
      updateData.expectedCloseDate = Timestamp.fromDate(dateVal);
    }

    await updateDoc(dealRef, updateData);
  } catch (error) {
    console.error('Error updating sales deal:', error);
    throw error;
  }
}

/**
 * Delete a sales deal
 */
export async function deleteSalesDeal(orgId: string, dealId: string): Promise<void> {
  try {
    const dealRef = doc(db, `organizations/${orgId}/sales_deals/${dealId}`);
    await deleteDoc(dealRef);
  } catch (error) {
    console.error('Error deleting sales deal:', error);
    throw error;
  }
}

/**
 * Move deal between stages and auto-calculate probability based on stage
 */
export async function moveStage(
  orgId: string,
  dealId: string,
  newStage: 'prospecting' | 'negotiating' | 'signed'
): Promise<void> {
  try {
    const stageWinProbability = {
      prospecting: 10,
      negotiating: 50,
      signed: 100,
    };

    await updateSalesDeal(orgId, dealId, {
      stage: newStage,
      winProbability: stageWinProbability[newStage],
    });
  } catch (error) {
    console.error('Error moving deal stage:', error);
    throw error;
  }
}
