import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/firebase';
import crypto from 'crypto';

const router = Router();

const UIDAI_API_URL = process.env.UIDAI_API_URL || '';
const UIDAI_API_KEY = process.env.UIDAI_API_KEY || '';
const NSDL_API_URL = process.env.NSDL_API_URL || '';
const NSDL_API_KEY = process.env.NSDL_API_KEY || '';
const SETU_KYC_URL = process.env.SETU_KYC_URL || '';
const SETU_KYC_KEY = process.env.SETU_KYC_KEY || '';

interface KYCRecord {
  id: string;
  orgId: string;
  applicationId?: string;
  borrowerId: string;
  type: 'aadhaar' | 'pan' | 'combined';
  status: 'pending' | 'verified' | 'failed' | 'manual_review';
  provider: string;
  referenceId?: string;
  data?: any;
  errorCode?: string;
  errorMessage?: string;
  consentTimestamp: Date;
  verifiedAt?: Date;
}

const isConfigured = (provider: string): boolean => {
  switch (provider) {
    case 'uidai': return !!(UIDAI_API_URL && UIDAI_API_KEY);
    case 'nsdl': return !!(NSDL_API_URL && NSDL_API_KEY);
    case 'setu': return !!(SETU_KYC_URL && SETU_KYC_KEY);
    default: return false;
  }
};

function validateAadhaar(aadhaar: string): boolean {
  const clean = aadhaar.replace(/\s/g, '');
  if (clean.length !== 12) return false;
  if (!/^\d{12}$/.test(clean)) return false;
  const lastDigit = parseInt(clean[11]);
  const sum = Array.from(clean.slice(0, 11)).reduce((acc, digit, i) => {
    return acc + (parseInt(digit) * (12 - i));
  }, 0);
  const checkDigit = (10 - (sum % 10)) % 10;
  return lastDigit === checkDigit;
}

function validatePAN(pan: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(pan);
}

async function saveKYCRecord(record: KYCRecord): Promise<string> {
  await db.collection('kyc_records').doc(record.id).set({
    ...record,
    consentTimestamp: new Date(),
    verifiedAt: record.status === 'verified' ? new Date() : null,
  });

  if (record.orgId) {
    await db.collection('audit_logs').add({
      orgId: record.orgId,
      action: 'KYC_' + record.status.toUpperCase(),
      targetId: record.id,
      detail: `${record.type.toUpperCase()} KYC ${record.status} for borrower ${record.borrowerId}`,
      timestamp: new Date(),
    });
  }

  return record.id;
}

async function fetchAadhaarFromUIDAI(aadhaar: string, name?: string): Promise<any> {
  const response = await fetch(`${UIDAI_API_URL}/v1/verify/aadhaar`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${UIDAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ aadhaarNumber: aadhaar, name }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'UIDAI API error');
  }

  return response.json();
}

async function fetchPANFromNSDL(pan: string): Promise<any> {
  const response = await fetch(`${NSDL_API_URL}/v2/pan/verify`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NSDL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pan }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'NSDL API error');
  }

  return response.json();
}

router.post('/aadhaar/verify', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { aadhaarNumber, name, consentId } = req.body;

    if (!aadhaarNumber) {
      return res.status(400).json({ error: 'Aadhaar number required' });
    }

    if (!validateAadhaar(aadhaarNumber)) {
      return res.status(400).json({ error: 'Invalid Aadhaar number format' });
    }

    const recordId = `kyc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    if (isConfigured('uidai')) {
      try {
        const result = await fetchAadhaarFromUIDAI(aadhaarNumber, name);

        const record: KYCRecord = {
          id: recordId,
          orgId: req.orgId!,
          borrowerId: req.body.borrowerId || '',
          applicationId: req.body.applicationId,
          type: 'aadhaar',
          status: 'verified',
          provider: 'UIDAI',
          referenceId: result.referenceId || `UIDAI-${Date.now()}`,
          data: {
            name: result.name,
            dob: result.dob,
            gender: result.gender,
            address: result.address,
            maskedMobile: result.maskedMobile,
          },
          consentTimestamp: new Date(),
        };

        await saveKYCRecord(record);

        return res.status(200).json({
          recordId,
          status: 'verified',
          referenceId: record.referenceId,
          name: result.name,
          dob: result.dob,
          gender: result.gender,
          maskedMobile: result.maskedMobile,
          provider: 'UIDAI',
        });
      } catch (error: any) {
        const failedRecord: KYCRecord = {
          id: recordId,
          orgId: req.orgId!,
          borrowerId: req.body.borrowerId || '',
          type: 'aadhaar',
          status: 'failed',
          provider: 'UIDAI',
          errorMessage: error.message,
          consentTimestamp: new Date(),
        };
        await saveKYCRecord(failedRecord);

        return res.status(400).json({
          recordId,
          status: 'failed',
          error: error.message || 'Aadhaar verification failed',
        });
      }
    }

    const record: KYCRecord = {
      id: recordId,
      orgId: req.orgId!,
      borrowerId: req.body.borrowerId || '',
      applicationId: req.body.applicationId,
      type: 'aadhaar',
      status: 'pending',
      provider: 'stub',
      referenceId: `UIDAI-STUB-${Date.now()}`,
      data: { name: name || 'Name on Aadhaar', dob: '01-01-1990' },
      consentTimestamp: new Date(),
    };

    await saveKYCRecord(record);

    return res.status(200).json({
      recordId,
      status: 'pending',
      referenceId: record.referenceId,
      message: 'KYC verification pending. Configure UIDAI_API_URL and UIDAI_API_KEY for live verification.',
      provider: 'stub',
    });
  } catch (error: any) {
    console.error('Aadhaar verification error:', error.message);
    res.status(500).json({ error: error.message || 'Verification failed' });
  }
});

router.post('/pan/verify', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { panNumber, name, consentId } = req.body;

    if (!panNumber) {
      return res.status(400).json({ error: 'PAN number required' });
    }

    if (!validatePAN(panNumber)) {
      return res.status(400).json({ error: 'Invalid PAN format. Expected: ABCDE1234F' });
    }

    const recordId = `kyc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    if (isConfigured('nsdl')) {
      try {
        const result = await fetchPANFromNSDL(panNumber);

        const record: KYCRecord = {
          id: recordId,
          orgId: req.orgId!,
          borrowerId: req.body.borrowerId || '',
          applicationId: req.body.applicationId,
          type: 'pan',
          status: 'verified',
          provider: 'NSDL',
          referenceId: result.referenceId || `NSDL-${Date.now()}`,
          data: {
            name: result.name,
            fatherName: result.fatherName,
            dob: result.dob,
            validationStatus: result.status,
          },
          consentTimestamp: new Date(),
        };

        await saveKYCRecord(record);

        return res.status(200).json({
          recordId,
          status: 'verified',
          referenceId: record.referenceId,
          name: result.name,
          fatherName: result.fatherName,
          dob: result.dob,
          validationStatus: result.status,
          provider: 'NSDL',
        });
      } catch (error: any) {
        const failedRecord: KYCRecord = {
          id: recordId,
          orgId: req.orgId!,
          borrowerId: req.body.borrowerId || '',
          type: 'pan',
          status: 'failed',
          provider: 'NSDL',
          errorMessage: error.message,
          consentTimestamp: new Date(),
        };
        await saveKYCRecord(failedRecord);

        return res.status(400).json({
          recordId,
          status: 'failed',
          error: error.message || 'PAN verification failed',
        });
      }
    }

    const record: KYCRecord = {
      id: recordId,
      orgId: req.orgId!,
      borrowerId: req.body.borrowerId || '',
      applicationId: req.body.applicationId,
      type: 'pan',
      status: 'pending',
      provider: 'stub',
      referenceId: `NSDL-STUB-${Date.now()}`,
      data: { name: name || 'Name on PAN' },
      consentTimestamp: new Date(),
    };

    await saveKYCRecord(record);

    return res.status(200).json({
      recordId,
      status: 'pending',
      referenceId: record.referenceId,
      message: 'KYC verification pending. Configure NSDL_API_URL and NSDL_API_KEY for live verification.',
      provider: 'stub',
    });
  } catch (error: any) {
    console.error('PAN verification error:', error.message);
    res.status(500).json({ error: error.message || 'Verification failed' });
  }
});

router.post('/verify-all', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { applicationId, borrowerId, aadhaarNumber, panNumber } = req.body;

    if (!borrowerId) {
      return res.status(400).json({ error: 'borrowerId is required' });
    }

    const results: any = {
      kycId: `kyc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      applicationId,
      borrowerId,
      startedAt: new Date().toISOString(),
      completedAt: null,
    };

    if (aadhaarNumber) {
      if (!validateAadhaar(aadhaarNumber)) {
        results.aadhaar = { status: 'failed', error: 'Invalid Aadhaar format' };
      } else {
        try {
          const recordId = `kyc_aadhaar_${Date.now()}`;
          if (isConfigured('uidai')) {
            const data = await fetchAadhaarFromUIDAI(aadhaarNumber);
            results.aadhaar = { status: 'verified', name: data.name, referenceId: data.referenceId };
          } else {
            results.aadhaar = { status: 'pending', provider: 'stub', message: 'UIDAI not configured' };
          }
        } catch (e: any) {
          results.aadhaar = { status: 'failed', error: e.message };
        }
      }
    }

    if (panNumber) {
      if (!validatePAN(panNumber)) {
        results.pan = { status: 'failed', error: 'Invalid PAN format' };
      } else {
        try {
          if (isConfigured('nsdl')) {
            const data = await fetchPANFromNSDL(panNumber);
            results.pan = { status: 'verified', name: data.name, referenceId: data.referenceId };
          } else {
            results.pan = { status: 'pending', provider: 'stub', message: 'NSDL not configured' };
          }
        } catch (e: any) {
          results.pan = { status: 'failed', error: e.message };
        }
      }
    }

    if (results.aadhaar?.status === 'verified' && results.pan?.status === 'verified') {
      const aadhaarName = (results.aadhaar.name || '').toLowerCase();
      const panName = (results.pan.name || '').toLowerCase();
      const firstName = aadhaarName.split(' ')[0] || panName.split(' ')[0];
      results.nameMatch = {
        status: aadhaarName.includes(firstName) || panName.includes(firstName) ? 'matched' : 'mismatch',
        aadhaarName: results.aadhaar.name,
        panName: results.pan.name,
      };
    }

    const verifiedCount = [results.aadhaar?.status, results.pan?.status].filter(s => s === 'verified').length;
    const totalRequested = [aadhaarNumber, panNumber].filter(Boolean).length;

    results.overallStatus = verifiedCount === totalRequested ? 'verified'
      : verifiedCount > 0 ? 'partial'
      : 'failed';

    results.completedAt = new Date().toISOString();

    await db.collection('kyc_records').doc(results.kycId).set({
      ...results,
      orgId: req.orgId,
      consentTimestamp: new Date(),
    });

    res.status(200).json(results);
  } catch (error: any) {
    console.error('Comprehensive KYC error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post('/batch-verify', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { applicants } = req.body;

    if (!Array.isArray(applicants) || applicants.length === 0) {
      return res.status(400).json({ error: 'applicants array required' });
    }

    if (applicants.length > 50) {
      return res.status(400).json({ error: 'Max 50 applicants per batch' });
    }

    const results = [];
    for (const app of applicants) {
      try {
        const body = { ...app, orgId: req.orgId, borrowerId: app.borrowerId || app.id };
        const verifyRes = await fetch(`${process.env.API_BASE_URL || 'http://localhost:8080'}/v1/kyc/verify-all`, {
          method: 'POST',
          headers: {
            'Authorization': req.headers.authorization || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        const data = await verifyRes.json();
        results.push({ id: app.id || app.borrowerId, ...data });
      } catch (e: any) {
        results.push({ id: app.id || app.borrowerId, status: 'failed', error: e?.message || 'Unknown error' });
      }
    }

    const verified = results.filter(r => r.overallStatus === 'verified').length;
    const partial = results.filter(r => r.overallStatus === 'partial').length;

    res.status(200).json({
      batchId: `batch_${Date.now()}`,
      total: results.length,
      verified,
      partial,
      failed: results.length - verified - partial,
      results,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/status/:applicationId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snapshot = await db.collection('kyc_records')
      .where('orgId', '==', req.orgId!)
      .where('applicationId', '==', req.params.applicationId)
      .orderBy('consentTimestamp', 'desc')
      .limit(5)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'No KYC records found for this application' });
    }

    const records = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    const latest = records[0];
    const combined = {
      aadhaar: records.find((r: any) => r.type === 'aadhaar'),
      pan: records.find((r: any) => r.type === 'pan'),
    };

    res.status(200).json({
      applicationId: req.params.applicationId,
      aadhaar: combined.aadhaar?.status || 'not_started',
      pan: combined.pan?.status || 'not_started',
      nameMatch: combined.aadhaar && combined.pan ? 'verified' : 'pending',
      lastVerified: latest?.verifiedAt || latest?.consentTimestamp,
      records,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;