/**
 * Pure security helpers with no external dependencies.
 *
 * Kept free of `firebase-admin`/Express imports so they can be unit-tested in
 * isolation (the auth middleware re-exports `hashApiKey` for its callers).
 */

import crypto from 'crypto';

/**
 * Hash an API key using SHA-256 for secure comparison.
 * We NEVER store plaintext keys, only their hashes.
 */
export const hashApiKey = (key: string): string => {
  return crypto.createHash('sha256').update(key).digest('hex');
};

/**
 * Strip angle brackets and clamp length on free-text input before it is
 * persisted or echoed back. Non-string input collapses to an empty string.
 */
export function sanitizeString(str: unknown, maxLen = 200): string {
  if (typeof str !== 'string') return '';
  return str.substring(0, maxLen).replace(/[<>]/g, '');
}
