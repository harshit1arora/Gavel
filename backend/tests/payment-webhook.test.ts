import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';

const records = new Map<string, Record<string, unknown>>();
const doc = (path: string) => ({ path });
const tx = {
  get: async (ref: { path: string }) => ({
    exists: records.has(ref.path), data: () => records.get(ref.path),
  }),
  set: (ref: { path: string }, data: object) =>
    records.set(ref.path, { ...records.get(ref.path), ...data }),
  create: (ref: { path: string }, data: Record<string, unknown>) => records.set(ref.path, data),
};
vi.mock('../src/config/firebase', () => ({
  db: {
    collection: (name: string) => ({ doc: (id: string) => doc(name + '/' + id) }),
    runTransaction: (work: (transaction: typeof tx) => Promise<void>) => work(tx),
  },
}));
import webhook from '../src/routes/webhooks';

async function deliver(event: object, key = 'fixture-secret') {
  const body = Buffer.from(JSON.stringify(event, null, 2));
  const signature = createHmac('sha256', key).update(body).digest('hex');
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  await webhook({ body, get: () => signature } as unknown as Request, res as unknown as Response);
  return res;
}

describe('Razorpay webhook accounting', () => {
  afterEach(() => { records.clear(); vi.unstubAllEnvs(); });
  const capture = { event: 'payment.captured', payload: { payment: { entity: { id: 'pay_1', amount: 1000 } } } };
  const refund = { event: 'refund.processed', payload: { refund: { entity: { id: 'rf_1', payment_id: 'pay_1', amount: 600 } } } };
  it('rejects an unconfigured secret and a signature mismatch before writing', async () => {
    vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', '');
    expect((await deliver(capture)).status).toHaveBeenCalledWith(503);
    vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', 'different');
    expect((await deliver(capture)).status).toHaveBeenCalledWith(400);
    expect(records.size).toBe(0);
  });
  it('retains a refund delivered before capture and counts each refund once', async () => {
    vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', 'fixture-secret');
    for (const event of [refund, capture, refund, capture]) {
      expect((await deliver(event)).json).toHaveBeenCalledWith({ received: true });
    }
    expect(records.get('payments/pay_1')).toMatchObject({ status: 'partial_refunded', amount: 10, refundedAmount: 6 });
    await deliver({ event: 'refund.processed', payload: { refund: { entity: { id: 'rf_2', payment_id: 'pay_1', amount: 400 } } } });
    expect(records.get('payments/pay_1')).toMatchObject({ status: 'refunded', refundedAmount: 10 });
  });
});
