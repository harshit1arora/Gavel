import { db, Timestamp } from '../config/firebase';
import EventEmitter from 'events';
import { v4 as uuidv4 } from 'uuid';
import { createSalesDeal } from './sales';
import { notifySlackDemoRequest, getSlackConfig } from './slack';

export interface DemoRequestInput {
  fullName: string;
  workEmail: string;
  company: string;
  phone?: string;
  companySize?: string;
  productInterest: string;
  preferredDay?: string;
  preferredTime?: string;
  message?: string;
}

export interface DemoRequest extends DemoRequestInput {
  id: string;
  status: 'pending' | 'contacted' | 'scheduled' | 'completed' | 'dismissed';
  createdAt: string;
  updatedAt: string;
  ipAddress?: string;
  userAgent?: string;
  assignedTo?: string;
  notes?: string;
}

// Global EventEmitter for real-time SSE stream listeners
export const demoEventEmitter = new EventEmitter();
demoEventEmitter.setMaxListeners(100);

// In-memory fallback for local development or when Firestore admin is uninitialized
const inMemoryDemoRequests: DemoRequest[] = [
  {
    id: 'demo-req-1',
    fullName: 'Ananya Roy',
    workEmail: 'ananya@fintechx.in',
    company: 'FintechX Capital',
    phone: '+91 98112 34567',
    companySize: '51-200',
    productInterest: 'full-suite',
    preferredDay: 'next-week',
    preferredTime: 'morning',
    message: 'Looking for fast underwriting integration for personal loan origination.',
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    ipAddress: '127.0.0.1',
  },
  {
    id: 'demo-req-2',
    fullName: 'Vikram Sethi',
    workEmail: 'vikram@bluebank.com',
    company: 'BlueBank Digital',
    phone: '+91 99887 65432',
    companySize: '500+',
    productInterest: 'credit-scoring',
    preferredDay: 'this-week',
    preferredTime: 'afternoon',
    message: 'Interested in credit risk scoring API for MSME loans.',
    status: 'contacted',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    ipAddress: '127.0.0.1',
  },
];

/**
 * Save a new demo request and trigger real-time notifications
 */
export async function saveDemoRequest(
  input: DemoRequestInput,
  meta?: { ipAddress?: string; userAgent?: string }
): Promise<DemoRequest> {
  const id = `demo-req-${uuidv4().substring(0, 8)}`;
  const now = new Date().toISOString();

  const newRequest: DemoRequest = {
    ...input,
    id,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    ipAddress: meta?.ipAddress || 'unknown',
    userAgent: meta?.userAgent || 'unknown',
  };

  let savedInDb = false;

  try {
    // Attempt Firestore persistence
    if (db && typeof db.collection === 'function') {
      await db.collection('demo_requests').doc(id).set({
        ...newRequest,
        firestoreTimestamp: Timestamp.now(),
      });
      savedInDb = true;
    }
  } catch (err: any) {
    console.warn('⚠️ Firestore demo request write failed, falling back to in-memory:', err.message);
  }

  // Always keep in memory store as fallback / fast cache
  inMemoryDemoRequests.unshift(newRequest);

  // 1. Emit real-time SSE event
  demoEventEmitter.emit('demo_request_created', newRequest);

  // 2. Asynchronously notify Slack if webhook is configured
  (async () => {
    try {
      // Check environment variable or Firestore slack config
      const defaultSlackWebhook = process.env.SLACK_WEBHOOK_URL;
      let webhookUrl = defaultSlackWebhook || '';

      if (!webhookUrl) {
        const slackConfig = await getSlackConfig('public-demo-bank');
        if (slackConfig?.enabled && slackConfig?.webhookUrl) {
          webhookUrl = slackConfig.webhookUrl;
        }
      }

      if (webhookUrl) {
        await notifySlackDemoRequest(webhookUrl, input);
      }
    } catch (slackErr) {
      console.warn('Failed to send Slack alert for demo request:', slackErr);
    }
  })();

  // 3. Automatically create lead in sales pipeline (prospecting stage)
  (async () => {
    try {
      // Estimated deal value based on company size
      let estimatedValue = 1000000; // default 10L INR
      if (input.companySize === '500+') estimatedValue = 5000000;
      else if (input.companySize === '201-500') estimatedValue = 2500000;
      else if (input.companySize === '51-200') estimatedValue = 1500000;

      await createSalesDeal('public-demo-bank', {
        prospectName: input.fullName,
        prospectCompany: input.company,
        prospectEmail: input.workEmail,
        prospectPhone: input.phone || '',
        stage: 'prospecting',
        valueEstimate: estimatedValue,
        winProbability: 20,
        expectedCloseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        notes: `Demo Request [${input.productInterest}] - Preferred: ${input.preferredDay || 'Flexible'} (${input.preferredTime || 'Anytime'}). Note: ${input.message || 'None'}`,
        assignedTo: 'sales-lead',
      });
    } catch (dealErr) {
      console.warn('Failed to auto-create sales deal for demo request:', dealErr);
    }
  })();

  return newRequest;
}

/**
 * Get all demo requests with optional filtering and pagination
 */
export async function getDemoRequests(filters?: {
  status?: string;
  search?: string;
  limit?: number;
}): Promise<DemoRequest[]> {
  try {
    if (db && typeof db.collection === 'function') {
      let query: any = db.collection('demo_requests');

      if (filters?.status) {
        query = query.where('status', '==', filters.status);
      }

      const snapshot = await query.get();

      if (!snapshot.empty) {
        let docs = snapshot.docs.map((doc: any) => {
          const data = doc.data();
          return {
            id: doc.id,
            fullName: data.fullName,
            workEmail: data.workEmail,
            company: data.company,
            phone: data.phone,
            companySize: data.companySize,
            productInterest: data.productInterest,
            preferredDay: data.preferredDay,
            preferredTime: data.preferredTime,
            message: data.message,
            status: data.status || 'pending',
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
            ipAddress: data.ipAddress,
            assignedTo: data.assignedTo,
            notes: data.notes,
          } as DemoRequest;
        });

        docs.sort((a: DemoRequest, b: DemoRequest) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (filters?.search) {
          const searchLower = filters.search.toLowerCase();
          docs = docs.filter(
            (d: DemoRequest) =>
              d.fullName.toLowerCase().includes(searchLower) ||
              d.workEmail.toLowerCase().includes(searchLower) ||
              d.company.toLowerCase().includes(searchLower)
          );
        }

        if (filters?.limit) {
          docs = docs.slice(0, filters.limit);
        }

        return docs;
      }
    }
  } catch (err: any) {
    console.warn('⚠️ Firestore demo request read error, using in-memory list:', err.message);
  }

  // Fallback to in-memory list
  let result = [...inMemoryDemoRequests];

  if (filters?.status) {
    result = result.filter((r) => r.status === filters.status);
  }

  if (filters?.search) {
    const s = filters.search.toLowerCase();
    result = result.filter(
      (r) =>
        r.fullName.toLowerCase().includes(s) ||
        r.workEmail.toLowerCase().includes(s) ||
        r.company.toLowerCase().includes(s)
    );
  }

  if (filters?.limit) {
    result = result.slice(0, filters.limit);
  }

  return result;
}

/**
 * Update demo request status and details
 */
export async function updateDemoRequestStatus(
  id: string,
  updates: {
    status?: DemoRequest['status'];
    notes?: string;
    assignedTo?: string;
  }
): Promise<DemoRequest | null> {
  const now = new Date().toISOString();

  // 1. Update in-memory cache
  const inMemItem = inMemoryDemoRequests.find((r) => r.id === id);
  if (inMemItem) {
    if (updates.status) inMemItem.status = updates.status;
    if (updates.notes !== undefined) inMemItem.notes = updates.notes;
    if (updates.assignedTo !== undefined) inMemItem.assignedTo = updates.assignedTo;
    inMemItem.updatedAt = now;
  }

  try {
    if (db && typeof db.collection === 'function') {
      const docRef = db.collection('demo_requests').doc(id);
      const docSnap = await docRef.get();

      if (docSnap.exists) {
        const updatePayload: any = { updatedAt: now };
        if (updates.status) updatePayload.status = updates.status;
        if (updates.notes !== undefined) updatePayload.notes = updates.notes;
        if (updates.assignedTo !== undefined) updatePayload.assignedTo = updates.assignedTo;

        await docRef.update(updatePayload);

        const updatedDoc = await docRef.get();
        const data = updatedDoc.data()!;
        
        const updatedItem: DemoRequest = {
          id: updatedDoc.id,
          fullName: data.fullName,
          workEmail: data.workEmail,
          company: data.company,
          phone: data.phone,
          companySize: data.companySize,
          productInterest: data.productInterest,
          preferredDay: data.preferredDay,
          preferredTime: data.preferredTime,
          message: data.message,
          status: data.status,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          ipAddress: data.ipAddress,
          assignedTo: data.assignedTo,
          notes: data.notes,
        };

        // Emit real-time update event
        demoEventEmitter.emit('demo_request_updated', updatedItem);
        return updatedItem;
      }
    }
  } catch (err: any) {
    console.warn('⚠️ Firestore demo request update error:', err.message);
  }

  if (inMemItem) {
    demoEventEmitter.emit('demo_request_updated', inMemItem);
    return inMemItem;
  }

  return null;
}

/**
 * Get summary stats for demo requests
 */
export async function getDemoRequestStats() {
  const requests = await getDemoRequests();

  const total = requests.length;
  const pending = requests.filter((r) => r.status === 'pending').length;
  const contacted = requests.filter((r) => r.status === 'contacted').length;
  const scheduled = requests.filter((r) => r.status === 'scheduled').length;
  const completed = requests.filter((r) => r.status === 'completed').length;

  const byProduct: Record<string, number> = {};
  requests.forEach((r) => {
    byProduct[r.productInterest] = (byProduct[r.productInterest] || 0) + 1;
  });

  return {
    total,
    pending,
    contacted,
    scheduled,
    completed,
    conversionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    byProduct,
  };
}
