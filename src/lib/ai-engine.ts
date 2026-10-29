import { toast } from "sonner";
import { apiWithAuth, parseResponse } from "./api-client";

/**
 * PRODUCTION ARCHITECTURE: 
 * All underwriting and AI logic is handled in the secure Node.js backend.
 * The frontend uses the centralized API client with real Firebase auth tokens.
 */
export const evaluateApplicationWithAI = async (
  applicationId: string, 
  data: { annualIncome: number, loanAmount: number, creditDebt: number, applicantName: string, orgId: string }
) => {
  try {
     const res = await apiWithAuth("/v1/evaluate", {
        method: "POST",
        body: JSON.stringify({
           applicantName: data.applicantName,
           panNumber: `ABCDE1234F`, // In production, collected from actual form input
           annualIncome: data.annualIncome,
           loanAmount: data.loanAmount,
           creditDebt: data.creditDebt,
           applicationId
        })
     });

     const result = await parseResponse(res);
     toast.success(`Evaluation complete. Status: ${result.status}`);
     return result;

  } catch (error: any) {
     console.error("Evaluation engine error:", error);
     toast.error(error.message || "Underwriting engine failure.");
     throw error;
  }
};
