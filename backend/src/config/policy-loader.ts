/**
 * Loads the hand-tuned, version-controlled pilot policy config.
 *
 * The JSON file is the single source of truth (diffable = an audit trail of
 * every threshold change). We read it from disk so the exact bytes can be
 * content-hashed for audit replay, with a bundled `require` fallback so the
 * loader never throws in any runtime (ts-node-dev, vitest, compiled dist).
 */

import fs from 'fs';
import path from 'path';
import { PolicyConfig } from '../types/underwriting';
import { hashPolicy } from '../services/underwriting-engine';

const PILOT = 'pilot-acme';

let cached: { policy: PolicyConfig; hash: string } | null = null;

export function loadPilotPolicy(): { policy: PolicyConfig; hash: string } {
  if (cached) return cached;

  let policy: PolicyConfig;
  try {
    const filePath = path.join(__dirname, 'policies', `${PILOT}.json`);
    policy = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as PolicyConfig;
  } catch {
    // Bundled fallback (compiled environments where the file isn't on disk).
     
    policy = require('./policies/pilot-acme.json') as PolicyConfig;
  }

  cached = { policy, hash: hashPolicy(policy) };
  return cached;
}
