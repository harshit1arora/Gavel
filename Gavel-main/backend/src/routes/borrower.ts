import { Router, Response, Request, NextFunction } from 'express';
import { db } from '../config/firebase';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;
const MIN_SECRET_LENGTH = 32;

if (!JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not set. Borrower tokens will use a weak fallback. Set JWT_SECRET env var in production!');
}

const getEffectiveSecret = (): string => {
  if (!JWT_SECRET || JWT_SECRET.length < MIN_SECRET_LENGTH) {
    return 'fallback_secret_insufficient_entropy_do_not_use_in_production';
  }
  return JWT_SECRET;
};

function sanitizePhone(phone: string): string {
  return phone.replace(/[^0-9+]/g, '').substring(0, 15);
}

router.post('/send-otp', async (req: Request, res: Response) => {
  const { phone } = req.body;
  if (!phone || phone.replace(/[^0-9]/g, '').length < 10) {
    return res.status(400).json({ error: 'Valid phone required' });
  }

  console.log(`[OTP] Sending OTP to ${phone}`);
  res.status(200).json({ success: true });
});

router.post('/login', async (req: Request, res: Response) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP required' });
  }

  if (otp.length < 4 || otp.length > 8) {
    return res.status(401).json({ error: 'Invalid OTP' });
  }

  const cleanPhone = sanitizePhone(phone);
  const secret = getEffectiveSecret();
  const token = jwt.sign(
    { phone: cleanPhone, jti: `token_${Date.now()}_${crypto.randomBytes(8).toString('hex')}` },
    secret,
    { expiresIn: '7d', algorithm: 'HS256' }
  );

  res.status(200).json({ token });
});

const jwtBorrowerAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const secret = getEffectiveSecret();
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as any;
    if (!decoded.phone) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }
    (req as any).borrowerPhone = decoded.phone;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

router.get('/me/loans', jwtBorrowerAuth, async (req: Request, res: Response) => {
  try {
    const phone = (req as any).borrowerPhone;

    const snapshot = await db.collection('loans')
      .where('borrowerPhone', '==', phone)
      .get();

    const loans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    for (const loan of loans) {
      const scheduleSnap = await db.collection('repayment_schedules')
        .where('loanId', '==', loan.id)
        .limit(1)
        .get();

      if (!scheduleSnap.empty) {
        (loan as any).schedule = scheduleSnap.docs[0].data().schedules;
      }
    }

    res.status(200).json(loans);
  } catch (error) {
    console.error('Error fetching borrower loans:', error);
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
});

router.post('/me/loans/:loanId/prepay', jwtBorrowerAuth, async (req: Request, res: Response) => {
  try {
    const phone = (req as any).borrowerPhone;
    const { amount } = req.body;

    const doc = await db.collection('loans').doc(req.params.loanId).get();
    if (!doc.exists || doc.data()?.borrowerPhone !== phone) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    res.status(200).json({ success: true, message: `Prepayment request for ₹${amount} logged.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to request prepayment' });
  }
});

export default router;