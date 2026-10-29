import { db } from '../config/firebase';

export interface SentinelSignal {
  type: 'gst' | 'upi' | 'aa' | 'bureau' | 'legal';
  value: any;
  timestamp: Date;
}

export interface SentinelScoreHistory {
  date: Date;
  score: number;
  category: 'Green' | 'Amber' | 'Red';
  reason: string;
}

export interface MonitoredBorrower {
  id?: string;
  orgId: string;
  applicantName: string;
  loanAmount: number;
  disbursementDate: Date;
  currentScore: number;
  riskCategory: 'Green' | 'Amber' | 'Red';
  signals: {
    gstTurnover: number;
    upiInflows: number;
    bureauScore: number;
    lastGstFilingDate: Date;
  };
  sector: string;
  location: string;
}

// Maximum history entries stored on the borrower document.
// Older entries are archived to a subcollection.
const MAX_INLINE_HISTORY = 50;

/**
 * Calculates a Sentinel Score based on various signals.
 */
export const calculateSentinelScore = (signals: any) => {
  let score = 750;
  const reasons: string[] = [];

  if (signals.gstTurnover < signals.avgGstTurnover * 0.7) {
    score -= 100;
    reasons.push("Significant drop in GST turnover (>30%)");
  }

  if (signals.upiInflows < signals.avgUpiInflows * 0.8) {
    score -= 50;
    reasons.push("Decline in UPI transaction volume");
  }

  if (signals.bureauScore < 650) {
    score -= 150;
    reasons.push("Credit bureau score fell below critical threshold");
  }

  score = Math.max(300, Math.min(900, score));

  let category: 'Green' | 'Amber' | 'Red' = 'Green';
  if (score < 500) category = 'Red';
  else if (score < 700) category = 'Amber';

  return { score, category, reason: reasons.join(". ") || "Stable performance." };
};

/**
 * Fetch monitored borrowers with pagination support.
 */
export const getMonitoredBorrowers = async (orgId: string, limit: number = 100, startAfterDoc?: any) => {
  let query = db.collection('monitored_borrowers')
    .where('orgId', '==', orgId)
    .orderBy('currentScore', 'asc') // Worst scores first
    .limit(limit);

  if (startAfterDoc) {
    query = query.startAfter(startAfterDoc);
  }
  
  const snapshot = await query.get();
  
  return {
    borrowers: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    hasMore: snapshot.docs.length === limit,
  };
};

/**
 * Ingest a new signal for a borrower and recalculate their score.
 * History is capped at MAX_INLINE_HISTORY entries inline.
 * Overflow entries are archived to a subcollection.
 */
export const ingestSignal = async (borrowerId: string, signal: SentinelSignal) => {
  const borrowerRef = db.collection('monitored_borrowers').doc(borrowerId);
  
  // Use a transaction for atomic read-modify-write
  return db.runTransaction(async (transaction) => {
    const doc = await transaction.get(borrowerRef);
    
    if (!doc.exists) throw new Error("Borrower not found");
    
    const data = doc.data() as MonitoredBorrower & { history: SentinelScoreHistory[] };
    
    // Update signal storage
    const updatedSignals = { ...data.signals };
    if (signal.type === 'gst') updatedSignals.gstTurnover = signal.value;
    if (signal.type === 'upi') updatedSignals.upiInflows = signal.value;
    if (signal.type === 'bureau') updatedSignals.bureauScore = signal.value;

    const evaluation = calculateSentinelScore({
      ...updatedSignals,
      avgGstTurnover: data.signals.gstTurnover,
      avgUpiInflows: data.signals.upiInflows
    });

    const historyItem: SentinelScoreHistory = {
      date: new Date(),
      score: evaluation.score,
      category: evaluation.category,
      reason: evaluation.reason
    };

    let history = [...(data.history || []), historyItem];

    // If history exceeds cap, archive oldest entries to subcollection
    if (history.length > MAX_INLINE_HISTORY) {
      const overflow = history.slice(0, history.length - MAX_INLINE_HISTORY);
      history = history.slice(-MAX_INLINE_HISTORY);

      // Archive overflow entries (outside transaction for performance)
      const archiveRef = borrowerRef.collection('history_archive');
      for (const entry of overflow) {
        archiveRef.add(entry).catch(console.error);
      }
    }

    transaction.update(borrowerRef, {
      signals: updatedSignals,
      currentScore: evaluation.score,
      riskCategory: evaluation.category,
      history,
    });

    return { id: borrowerId, evaluation };
  });
};
