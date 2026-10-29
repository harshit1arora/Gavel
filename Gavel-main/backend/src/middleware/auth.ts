import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { db } from '../config/firebase';
import { hashApiKey } from '../utils/security';

export interface AuthenticatedRequest extends Request {
  orgId?: string;
  apiKeyId?: string;
  uid?: string;
  userId?: string;
  userName?: string;
}

// Re-exported from the dependency-free security util so existing callers
// (`import { hashApiKey } from '../middleware/auth'`) keep working.
export { hashApiKey };

/**
 * Middleware: Authenticate via API Key (for programmatic/SDK access).
 * Keys are stored as SHA-256 hashes in Firestore.
 * Includes rate limiting awareness via usage logging.
 */

/**
 * File-backed API keys.
 *
 * Self-hosted deployments (and anyone evaluating the gateway without a Firebase
 * project) can point API_KEYS_FILE at the JSON written by
 * `engine-py/scripts/create_key.py`. Keys are matched on the SHA-256 hash, the
 * same as the Firestore path, so a key issued by either tool works on both
 * services.
 */
interface FileKeyRecord {
  id: string;
  org_id: string;
  org_name: string;
  name: string;
  env: string;
  scopes: string[];
  key_hash: string;
  is_active: boolean;
}

const loadFileKeys = (): FileKeyRecord[] => {
  const path = process.env.API_KEYS_FILE;
  if (!path) return [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs');
    if (!fs.existsSync(path)) return [];
    return JSON.parse(fs.readFileSync(path, 'utf-8')) as FileKeyRecord[];
  } catch {
    return [];
  }
};

const findFileKey = (hashedToken: string): FileKeyRecord | undefined =>
  loadFileKeys().find((k) => k.key_hash === hashedToken && k.is_active !== false);

export const authenticateApiToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // Hash the incoming key and compare against stored hashes
    const hashedToken = hashApiKey(token);

    // Firestore first. If the project is not configured (self-hosted, or a
    // deployment without credentials) the query throws, and we fall through to
    // the key file rather than turning every request into a 500.
    let keysSnapshot: Awaited<ReturnType<ReturnType<typeof db.collection>['get']>> | null = null;
    try {
      keysSnapshot = await db.collection('api_keys')
        .where('keyHash', '==', hashedToken)
        .where('isActive', '==', true)
        .limit(1)
        .get();
    } catch {
      keysSnapshot = null;
    }

    if (!keysSnapshot || keysSnapshot.empty) {
      const fileKey = findFileKey(hashedToken);
      if (fileKey) {
        req.orgId = fileKey.org_id;
        req.apiKeyId = fileKey.id;
        return next();
      }
      return res.status(401).json({ error: 'Invalid or revoked API key' });
    }

    const keyDoc = keysSnapshot.docs[0];
    const keyData = keyDoc.data();

    // Attach verified identity to request
    req.orgId = keyData.orgId;
    req.apiKeyId = keyDoc.id;

    // Update last used timestamp (fire-and-forget)
    keyDoc.ref.update({ lastUsedAt: new Date() }).catch(() => {});

    // Log usage asynchronously
    db.collection('usage_logs').add({
      orgId: keyData.orgId,
      path: req.originalUrl,
      method: req.method,
      status: 200,
      durationMs: 0,
      timestamp: new Date()
    }).catch(console.error);

    next();
  } catch (err) {
    console.error('Auth verification error:', err);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

/**
 * Middleware: Authenticate via Firebase ID Token (for dashboard/console access).
 * Used for admin operations like key generation, webhook config, etc.
 * This verifies the user's identity through Firebase Auth, no bypasses.
 */
export const authenticateFirebaseToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.uid = decodedToken.uid;
    req.orgId = decodedToken.uid; // In Gavel, orgId === user's Firebase UID
    req.userId = decodedToken.uid;
    req.userName = decodedToken.email || decodedToken.name || 'User';
    next();
  } catch (err) {
    console.error('Firebase token verification failed:', err);
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
};

/**
 * Middleware: Authenticate via API Key or Firebase ID Token.
 * Allows dual access for both internal dashboard and external API clients.
 */
export const authenticateAnyToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  // Detect by shape, not by length. A JWT is three base64url segments joined by
  // dots; an API key is a prefixed opaque string (sk_live_…, sk_test_…). The old
  // `token.length > 200` heuristic mis-routed any long API key and any short JWT.
  const segments = token.split('.');
  const looksLikeJwt = segments.length === 3 && segments[0].startsWith('eyJ');

  if (looksLikeJwt) {
    return authenticateFirebaseToken(req, res, next);
  }
  return authenticateApiToken(req, res, next);
};
