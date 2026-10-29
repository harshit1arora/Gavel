/**
 * Single-sourced contract types for the Gavel underwriting decision.
 *
 * These mirror the backend engine's `AnalysisResult` shape in
 * `backend/src/types/underwriting.ts` exactly. The mock engine and the live
 * `/v1/underwriting/analyze` endpoint both produce this shape, so the Sandbox
 * can render either interchangeably. Keep the two files in sync.
 */

export type DecisionType = 'APPROVE' | 'REJECT' | 'REVIEW';

export interface Reason {
  code: string;
  label: string;
  weight: number;
  detail: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface Rule {
  id: string;
  name: string;
  condition: string;
  result: boolean;
  skipped: boolean;
}

export interface ErrorResult {
  code: string;
  message: string;
  detail: string;
}

export interface AnalysisResult {
  decision: DecisionType;
  credit_limit: number;
  risk_score: number;
  confidence: number;
  processing_time_ms: number;
  engine_version: string;
  audit_id: string;
  reasons: Reason[];
  rules_fired: Rule[];
  flags: string[];
  error?: ErrorResult;
}
