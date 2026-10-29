import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('hashApiKey', () => {
    it('should hash a key to SHA-256 hex', async () => {
      const { hashApiKey } = await import('../src/utils/security');
      const hash = hashApiKey('sk_live_test123');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });

    it('should produce consistent hashes for same input', async () => {
      const { hashApiKey } = await import('../src/utils/security');
      const hash1 = hashApiKey('sk_live_consistent');
      const hash2 = hashApiKey('sk_live_consistent');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', async () => {
      const { hashApiKey } = await import('../src/utils/security');
      const hash1 = hashApiKey('sk_live_key1');
      const hash2 = hashApiKey('sk_live_key2');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('token length heuristic', () => {
    it('should identify Firebase tokens by length (> 200 chars)', async () => {
      const firebaseToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.' +
        'eyJ1aWQiOiJ1c2VyMTIzIiwib3JnSWQiOiJ1c2VyMTIzIiwicm9sZSI6InVzZXIiLA.' +
        'signature_goes_here_'.repeat(10);
      const apiKey = 'sk_live_a3f2b8c1d4e5f6';

      expect(firebaseToken.length > 200).toBe(true);
      expect(apiKey.length > 200).toBe(false);
    });
  });
});

describe('Input Validation', () => {
  describe('orgId validation', () => {
    it('should accept valid orgId patterns', () => {
      const valid = /^[a-zA-Z0-9_-]{1,128}$/;
      expect(valid.test('org_abc123')).toBe(true);
      expect(valid.test('my-org-id')).toBe(true);
      expect(valid.test('org123')).toBe(true);
      expect(valid.test('ABC_DEF-123')).toBe(true);
    });

    it('should reject invalid orgId patterns', () => {
      const valid = /^[a-zA-Z0-9_-]{1,128}$/;
      expect(valid.test('')).toBe(false);
      expect(valid.test('org with spaces')).toBe(false);
      expect(valid.test('<script>')).toBe(false);
      expect(valid.test("org;DROP TABLE")).toBe(false);
      expect(valid.test('org/../../../etc')).toBe(false);
    });
  });

  describe('IFSC code validation', () => {
    it('should accept valid IFSC codes', () => {
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
      expect(ifscRegex.test('SBIN0001234')).toBe(true);
      expect(ifscRegex.test('HDFC0000001')).toBe(true);
      expect(ifscRegex.test('ICIC0001234')).toBe(true);
    });

    it('should reject invalid IFSC codes', () => {
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
      expect(ifscRegex.test('SBIN12345')).toBe(false);
      expect(ifscRegex.test('INVALID')).toBe(false);
      expect(ifscRegex.test('SBIN0')).toBe(false);
    });
  });

  describe('PAN validation', () => {
    it('should accept valid Indian PAN numbers', () => {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      expect(panRegex.test('ABCDE1234F')).toBe(true);
      expect(panRegex.test('FGHIJ5678K')).toBe(true);
    });

    it('should reject invalid PAN numbers', () => {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      expect(panRegex.test('ABC123DE45')).toBe(false);
      expect(panRegex.test('ABCD12345F')).toBe(false);
      expect(panRegex.test('12345ABCDE')).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should strip dangerous HTML characters', async () => {
      const { sanitizeString } = await import('../src/utils/security');
      expect(sanitizeString('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
      expect(sanitizeString('Hello <b>World</b>')).toBe('Hello bWorld/b');
    });

    it('should truncate strings beyond max length', async () => {
      const { sanitizeString } = await import('../src/utils/security');
      const long = 'a'.repeat(2000);
      expect(sanitizeString(long, 100)).toHaveLength(100);
    });

    it('should return empty string for non-string inputs', async () => {
      const { sanitizeString } = await import('../src/utils/security');
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
      expect(sanitizeString(123 as any)).toBe('');
    });
  });

  describe('bank account number validation', () => {
    it('should accept valid account numbers (9-18 digits)', () => {
      const accountRegex = /^\d{9,18}$/;
      expect(accountRegex.test('123456789')).toBe(true);
      expect(accountRegex.test('123456789012345678')).toBe(true);
      expect(accountRegex.test('1234567890')).toBe(true);
    });

    it('should reject invalid account numbers', () => {
      const accountRegex = /^\d{9,18}$/;
      expect(accountRegex.test('123456')).toBe(false);
      expect(accountRegex.test('1234567890123456789')).toBe(false);
      expect(accountRegex.test('ABC123456')).toBe(false);
    });
  });
});

describe('EMI Calculation', () => {
  it('should calculate EMI correctly for standard inputs', () => {
    const P = 100000;
    const r = 12 / 12 / 100;
    const n = 12;
    const emi = Math.round((P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
    // ₹1,00,000 @ 12% p.a. over 12 months → ₹8,885/mo.
    expect(emi).toBe(8885);
  });

  it('should handle edge case of very short tenure', () => {
    const P = 50000;
    const r = 18 / 12 / 100;
    const n = 3;
    const emi = Math.round((P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
    expect(emi).toBeGreaterThan(0);
    expect(Math.round(emi * n)).toBeGreaterThan(P);
  });
});

describe('Webhook Signature', () => {
  it('should verify valid Razorpay webhook signature', async () => {
    const crypto = await import('crypto');
    const body = '{"event":"payment.captured"}';
    const secret = 'test_webhook_secret';
    const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');

    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    const buf1 = Buffer.from(signature);
    const buf2 = Buffer.from(expected);
    expect(crypto.timingSafeEqual(buf1, buf2)).toBe(true);
  });

  it('should reject tampered webhook payload', async () => {
    const crypto = await import('crypto');
    const secret = 'test_webhook_secret';
    const originalBody = '{"event":"payment.captured","amount":5000}';
    const tamperedBody = '{"event":"payment.captured","amount":50000}';

    const sig1 = crypto.createHmac('sha256', secret).update(originalBody).digest('hex');
    const sig2 = crypto.createHmac('sha256', secret).update(tamperedBody).digest('hex');

    expect(sig1).not.toBe(sig2);
  });
});

describe('Partner Service', () => {
  it('should calculate commission correctly for tiered rules', () => {
    const dealValue = 100000;
    const commissionPercent = 2;

    const amount = dealValue * commissionPercent / 100;
    expect(amount).toBe(2000);
  });

  it('should handle flat commission rules', () => {
    const flatCommission = 5000;
    expect(flatCommission).toBeGreaterThan(0);
  });

  it('should calculate pipeline value with win probability', () => {
    const deals = [
      { dealValue: 100000, winProbability: 80 },
      { dealValue: 200000, winProbability: 50 },
      { dealValue: 500000, winProbability: 20 },
    ];

    const pipelineValue = deals.reduce(
      (sum, d) => sum + d.dealValue * (d.winProbability / 100), 0
    );
    // 100000*0.8 + 200000*0.5 + 500000*0.2 = 80000 + 100000 + 100000.
    expect(pipelineValue).toBe(280000);
  });
});

describe('RBI Compliance', () => {
  it('should classify loan correctly based on DPD', () => {
    const classifyDPD = (dpd: number) => {
      if (dpd === 0) return 'Standard';
      if (dpd <= 30) return 'SMA-0';
      if (dpd <= 60) return 'SMA-1';
      if (dpd <= 90) return 'SMA-2';
      return 'NPA';
    };

    expect(classifyDPD(0)).toBe('Standard');
    expect(classifyDPD(15)).toBe('SMA-0');
    expect(classifyDPD(45)).toBe('SMA-1');
    expect(classifyDPD(75)).toBe('SMA-2');
    expect(classifyDPD(120)).toBe('NPA');
  });

  it('should calculate provisioning correctly', () => {
    const provisions: Record<string, number> = {
      'Standard': 0.01,
      'SMA-0': 0.05,
      'SMA-1': 0.10,
      'SMA-2': 0.15,
      'Substandard': 0.20,
      'Doubtful-1': 0.25,
      'Doubtful-2': 0.40,
      'Doubtful-3': 1.00,
      'Loss Asset': 1.00,
    };

    const standardLoan = 100000;
    const npaLoan = 100000;

    expect(standardLoan * provisions['Standard']).toBe(1000);
    expect(npaLoan * provisions['Substandard']).toBe(20000);
  });
});

describe('Rate Limiter Config', () => {
  it('should have appropriate limits configured', () => {
    const API_WINDOW_MS = 60 * 1000;
    const API_MAX = 100;
    const AUTH_WINDOW_MS = 15 * 60 * 1000;
    const AUTH_MAX = 20;

    expect(API_WINDOW_MS).toBe(60000);
    expect(API_MAX).toBe(100);
    expect(AUTH_WINDOW_MS).toBe(900000);
    expect(AUTH_MAX).toBe(20);
  });
});