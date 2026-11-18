// Import the policy so tsc includes it alongside the compiled gateway.
import pilotPolicy from './policies/pilot-acme.json';
import { PolicyConfig } from '../types/underwriting';
import { hashPolicy } from '../services/underwriting-engine';

let cached: { policy: PolicyConfig; hash: string } | null = null;

export function loadPilotPolicy(): { policy: PolicyConfig; hash: string } {
  if (cached) return cached;

  const policy = pilotPolicy as PolicyConfig;

  cached = { policy, hash: hashPolicy(policy) };
  return cached;
}
