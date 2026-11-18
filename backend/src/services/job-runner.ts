import { randomUUID } from 'crypto';
import type { Firestore } from 'firebase-admin/firestore';

export interface Job {
  name: string;
  interval: number;
  offset?: number;
  run: () => Promise<unknown>;
}

export function dueSlot(job: Job, now: number) {
  const offset = job.offset || 0;
  return Math.floor((now - offset) / job.interval) * job.interval + offset;
}

export async function runDueJob(db: Firestore, job: Job, now = Date.now()) {
  const state = db.collection('job_state').doc(job.name);
  const token = randomUUID();
  const slot = await db.runTransaction(async tx => {
    const data = (await tx.get(state)).data();
    if (data?.active) return null;
    const latest = dueSlot(job, now);
    const next = data?.nextSlot ?? latest;
    if (next > latest) return null;
    // All three jobs inspect current state. One pass covers downtime without
    // sending today's notifications once for every missed historical slot.
    const slot = data?.retrySlot ?? latest;
    const run = state.collection('runs').doc(String(slot));
    tx.set(state, { active: token, slot, retrySlot: null, startedAt: new Date(now) }, { merge: true });
    tx.set(run, { slot, token, coveredFrom: next, status: 'running', startedAt: new Date(now) }, { merge: true });
    return slot;
  });
  if (slot === null) return false;
  const run = state.collection('runs').doc(String(slot));
  try {
    await job.run();
  } catch (error) {
    await run.update({ status: 'needs_review', error: String(error).slice(0, 500), failedAt: new Date() });
    throw error;
  }
  await db.runTransaction(async tx => {
    if ((await tx.get(state)).get('active') !== token) throw Error('Worker ownership changed');
    tx.update(run, { status: 'completed', finishedAt: new Date() });
    tx.update(state, { active: null, nextSlot: slot + job.interval });
  });
  return true;
}

// Operators inspect external effects and stop the original worker before recovering an interrupted run.
export async function recoverJob(db: Firestore, job: Job, token: string, action: string, reason: string) {
  if (!['retry', 'complete'].includes(action) || !reason.trim()) throw Error('Expected retry or complete and a reason');
  const state = db.collection('job_state').doc(job.name);
  await db.runTransaction(async tx => {
    const data = (await tx.get(state)).data();
    if (!data || !token || data.active !== token) throw Error('Run token does not match the active job');
    tx.update(state.collection('runs').doc(String(data.slot)), { status: 'operator_' + action, reason, resolvedAt: new Date() });
    tx.create(db.collection('job_recovery_log').doc(), { job: job.name, slot: data.slot, token, action, reason, at: new Date() });
    tx.update(state, { active: null, retrySlot: action === 'retry' ? data.slot : null, nextSlot: data.slot + (action === 'complete' ? job.interval : 0) });
  });
}
