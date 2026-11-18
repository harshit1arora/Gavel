import { tmpdir } from 'os';
import { join } from 'path';
import { writeFile } from 'fs/promises';
import { db } from './config/firebase';
import { processWebhookQueue } from './services/webhooks';
import { runDailyCollectionCheck } from './services/collection-automation';
import { runPortfolioClassification } from './services/compliance-engine';
import { Job, recoverJob, runDueJob } from './services/job-runner';

const hour = 3600000;
const jobs: Job[] = [
  { name: 'webhooks', interval: 30000, run: processWebhookQueue },
  { name: 'collections', interval: 6 * hour, run: runDailyCollectionCheck },
  { name: 'portfolio', interval: 24 * hour, offset: 6 * hour, run: runPortfolioClassification },
];

async function main() {
  const [command, name, token, action, ...reason] = process.argv.slice(2);
  if (command) {
    if (command === 'status') {
      for (const job of jobs) {
        const state = await db.collection('job_state').doc(job.name).get();
        const slot = state.get('slot');
        const run = slot === undefined ? null : (await state.ref.collection('runs').doc(String(slot)).get()).data();
        console.log(JSON.stringify({ job: job.name, state: state.data() || null, run }));
      }
      return;
    }
    const job = jobs.find(item => item.name === name);
    if (command !== 'recover' || !job) throw Error('Usage: recover JOB TOKEN retry|complete REASON');
    await recoverJob(db, job, token, action, reason.join(' '));
    return;
  }
  let stopping = false;
  process.on('SIGTERM', () => { stopping = true; });
  process.on('SIGINT', () => { stopping = true; });
  await Promise.all(jobs.map(async job => {
    while (!stopping) {
      try {
        await runDueJob(db, job);
        await writeFile(join(tmpdir(), 'gavel-worker-ready'), String(Date.now()));
      }
      catch (err) { console.error('Worker failure', job.name, err); }
      if (!stopping) await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }));
}
main().catch(err => { console.error(err); process.exitCode = 1; });
