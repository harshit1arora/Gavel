import { Router, Request, Response } from 'express';
import { db } from '../config/firebase';
import { authenticateFirebaseToken, AuthenticatedRequest, hashApiKey } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

/**
 * @api {post} /v1/apikeys Generate API Key
 * SECURED by Firebase ID Token, only the authenticated user can create keys for their own org.
 * Keys are stored as SHA-256 hashes. The plaintext is returned ONCE and never stored.
 */
router.post('/', authenticateFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!; // Set by authenticateFirebaseToken from the verified JWT
    const { name, env } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing required field: name' });
    }

    // Generate cryptographically secure key
    const rawKey = `sk_${env || 'live'}_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = hashApiKey(rawKey);

    const docData = {
      keyHash, // Store ONLY the hash
      keyPrefix: rawKey.substring(0, 12), // Store prefix for display (e.g., "sk_live_a3f2")
      name,
      env: env || 'live',
      orgId,
      createdAt: new Date(),
      lastUsedAt: null,
      isActive: true,
    };

    const docRef = await db.collection('api_keys').add(docData);

    // Return the plaintext key ONCE; it is never stored or retrievable again
    res.status(201).json({
      id: docRef.id,
      key: rawKey, // Show Once protocol
      keyPrefix: docData.keyPrefix,
      name,
      env: docData.env,
      createdAt: docData.createdAt,
      isActive: true,
    });

  } catch (error) {
    console.error('API Key Generation Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @api {delete} /v1/apikeys/:id Revoke API Key
 * SECURED by Firebase ID Token. Verify ownership before revocation.
 */
router.delete('/:id', authenticateFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.orgId!;
    const { id } = req.params;

    const keyDoc = await db.collection('api_keys').doc(id).get();
    if (!keyDoc.exists) {
      return res.status(404).json({ error: 'API key not found' });
    }

    // Verify ownership, prevent cross-tenant key revocation
    if (keyDoc.data()!.orgId !== orgId) {
      return res.status(403).json({ error: 'Forbidden: You do not own this key' });
    }

    await db.collection('api_keys').doc(id).update({ isActive: false, revokedAt: new Date() });

    // Audit log
    await db.collection('audit_logs').add({
      orgId,
      action: 'API_KEY_REVOKED',
      targetId: id,
      actor: req.uid,
      timestamp: new Date(),
    });

    res.status(200).json({ success: true, message: 'Key revoked' });
  } catch (error) {
    console.error('API Key Revocation Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
