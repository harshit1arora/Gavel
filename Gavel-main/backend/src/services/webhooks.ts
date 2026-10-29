import crypto from 'crypto';
import { db } from '../config/firebase';

export interface WebhookPayload {
  eventId: string;
  eventType: string;
  timestamp: string;
  data: any;
}

const signPayload = (payload: string, secretKey: string): string => {
  return crypto.createHmac('sha256', secretKey).update(payload).digest('hex');
};

/**
 * Enqueue a webhook for delivery. Delivery is handled by the processor.
 */
export const dispatchWebhook = async (orgId: string, eventType: string, data: any) => {
  try {
    const webhookDoc = await db.collection('webhooks').doc(orgId).get();
    if (!webhookDoc.exists) return;

    const { targetUrl, secretKey, isActive } = webhookDoc.data()!;
    if (!isActive || !targetUrl) return;

    const payload: WebhookPayload = {
      eventId: `evt_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
      eventType,
      timestamp: new Date().toISOString(),
      data
    };

    await db.collection('webhook_queue').add({
      orgId,
      targetUrl,
      secretKey,
      payload,
      eventType,
      attempts: 0,
      nextAttemptAt: new Date(),
      status: 'pending' // pending, completed, failed
    });
    
    // Optionally trigger processor immediately (fire-and-forget)
    processWebhookQueue().catch(() => {});
  } catch (err) {
    console.error(`[Webhook Enqueue Error] Org ${orgId}:`, err);
  }
};

/**
 * Process the webhook queue, attempting delivery and handling backoff.
 * Max attempts: 3 (Immediate, +30s, +5m)
 */
export const processWebhookQueue = async () => {
  const now = new Date();
  
  // Find pending tasks that are ready to be retried
  const snapshot = await db.collection('webhook_queue')
    .where('status', '==', 'pending')
    .where('nextAttemptAt', '<=', now)
    .limit(50)
    .get();

  if (snapshot.empty) return;

  const backoffDelaysMs = [
    0,                          // Immediate (first attempt)
    30 * 1000,                  // 30 seconds
    2 * 60 * 1000,             // 2 minutes  
    10 * 60 * 1000,            // 10 minutes
    30 * 60 * 1000             // 30 minutes (max 5 retries)
  ];
  const MAX_ATTEMPTS = 5;
  const MAX_RETRY_HOURS = 24; // Stop retrying after 24 hours

  const batch = db.batch();

  for (const doc of snapshot.docs) {
    const task = doc.data();
    const payloadString = JSON.stringify(task.payload);
    const signature = signPayload(payloadString, task.secretKey);
    const attemptNumber = task.attempts + 1;

    try {
      const response = await fetch(task.targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gavel-Signature': `sha256=${signature}`,
          'X-Gavel-Event': task.eventType,
          'X-Gavel-Delivery': task.payload.eventId,
          'X-Gavel-Attempt': attemptNumber.toString(),
        },
        body: payloadString,
        // Short timeout for webhooks (10s) to prevent hanging
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        batch.update(doc.ref, { status: 'completed', completedAt: new Date(), attempts: attemptNumber });
        db.collection('webhook_logs').add({
          orgId: task.orgId,
          eventId: task.payload.eventId,
          eventType: task.eventType,
          targetUrl: task.targetUrl,
          status: response.status,
          success: true,
          timestamp: new Date()
        }).catch(() => {});
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      if (attemptNumber >= backoffDelaysMs.length) {
        // Max attempts reached
        batch.update(doc.ref, { status: 'failed', failedAt: new Date(), attempts: attemptNumber, lastError: error.message });
        db.collection('webhook_logs').add({
          orgId: task.orgId,
          eventId: task.payload.eventId,
          eventType: task.eventType,
          targetUrl: task.targetUrl,
          status: 0,
          success: false,
          error: `Failed after ${attemptNumber} attempts: ${error.message}`,
          timestamp: new Date()
        }).catch(() => {});
      } else {
        // Schedule retry
        const nextAttemptAt = new Date(Date.now() + backoffDelaysMs[attemptNumber]);
        batch.update(doc.ref, { attempts: attemptNumber, nextAttemptAt, lastError: error.message });
      }
    }
  }

  await batch.commit();
};
