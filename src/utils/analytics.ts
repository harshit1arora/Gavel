/**
 * Safely tracks events and parameters to Microsoft Clarity
 */
export const trackClarityEvent = (eventName: string, params?: Record<string, string | number>) => {
  try {
    if (typeof window !== 'undefined' && (window as any).clarity) {
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          (window as any).clarity("set", key, String(val));
        });
      }
      (window as any).clarity("event", eventName);
    }
  } catch (err) {
    // Fail silently in development/sandbox or if blocked by client privacy rules
  }
};

// Predictor Funnel Telemetry
export const trackPredictorStart = () => {
  trackClarityEvent("predictor_start");
};

export const trackPredictorUpload = (fileName: string, fileSize: number) => {
  trackClarityEvent("predictor_upload", { fileName, fileSize: Math.round(fileSize) });
};

export const trackPredictorSuccess = (reportId: string, approvalOdds: number) => {
  trackClarityEvent("predictor_success", { reportId, approvalOdds });
};

export const trackPredictorError = (reason: string) => {
  trackClarityEvent("predictor_error", { reason });
};

// Tool / Calculator Telemetry
export const trackCalculatorUsage = (calculatorName: string, action: string) => {
  trackClarityEvent("calculator_usage", { calculatorName, action });
};

// SEO Directory & Search Telemetry
export const trackSearchUsage = (query: string, resultCount: number) => {
  trackClarityEvent("internal_search", { query, resultCount });
};

export const trackFAQInteraction = (question: string) => {
  trackClarityEvent("faq_interaction", { question: question.slice(0, 100) });
};

export const trackTopicalHubVisit = (topic: string) => {
  trackClarityEvent("topical_hub_visit", { topic });
};

// Report / Share Telemetry
export const trackReportShare = (platform: string, reportId: string) => {
  trackClarityEvent("report_share", { platform, reportId });
};

// Winner Page Enrichment hooks
export const trackWinnerPageTrigger = (slug: string, elementId: string) => {
  trackClarityEvent("winner_page_action", { slug, elementId });
};
