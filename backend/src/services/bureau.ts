export interface BureauResponse {
  score: number;
  provider: string;
  signals: {
    dtiRatioHigh: boolean;
    bureauHitStable: boolean;
    incomeVerified: boolean;
    fraudFlagsDetected: boolean;
  };
}

/**
 * Bureau Integration Abstraction Layer.
 *
 * ARCHITECTURE: This is the integration point for real credit bureau APIs.
 * In production, swap the implementation here to call:
 * - TransUnion CIBIL API (https://www.transunioncibil.com/developer)
 * - Experian Hunter API
 * - CRIF High Mark
 *
 * The interface remains stable, callers don't need to change.
 *
 * CURRENT STATE: Uses deterministic scoring based on PAN for development.
 * This is clearly marked as a stub and will be replaced with real API calls
 * when bureau partnership agreements are signed.
 */
export const fetchBureauData = async (panNumber: string, requestedAmount: number): Promise<BureauResponse> => {
  // TODO: Replace with real CIBIL/Experian API call
  // const response = await fetch('https://api.cibil.com/v2/credit-report', {
  // method: 'POST',
  // headers: { 'Authorization': `Bearer ${process.env.CIBIL_API_KEY}` },
  // body: JSON.stringify({ pan: panNumber, consent: true })
  // });

  // Deterministic stub scoring for development
  // Generates consistent scores per PAN so evaluations are reproducible
  const panHash = panNumber.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const score = Math.min(850, Math.max(300, 600 + (panHash % 250) - 50));

  return {
    score,
    provider: 'STUB_DEVELOPMENT', // Clearly marked as non-production
    signals: {
      dtiRatioHigh: requestedAmount > 500000 && score < 700,
      bureauHitStable: score >= 650,
      incomeVerified: true,
      fraudFlagsDetected: panNumber.startsWith('ERR')
    }
  };
};

/**
 * Interface for future real bureau integration.
 * Implement this when bureau API keys are available.
 */
export interface BureauProvider {
  name: string;
  fetchCreditReport(pan: string, amount: number): Promise<BureauResponse>;
  healthCheck(): Promise<{ healthy: boolean; latencyMs: number }>;
}
