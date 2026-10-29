/**
 * System service, no more hardcoded constants.
 * Integration status is now managed in Firestore and served via the /v1/system route.
 * This file is kept for any shared system-level utilities.
 */

export interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected';
  latency: string;
  configurable: boolean;
  lastChecked?: Date | null;
}
