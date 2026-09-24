// ============================================================================
// lib/contracts.ts — Single source of truth matching PRD.md §9 and
// Architecture.md §7. Keep backend/app/schemas.py in lockstep with this file.
// All fields use exact backend wire format (snake_case).
// ============================================================================

export type VerdictContract = "FRAUD" | "LEGITIMATE" | "UNCERTAIN";
export type UncertaintyContract = "LOW" | "MEDIUM" | "HIGH";
export type FraudPatternContract =
  | "card_testing"
  | "cnp"
  | "cnp_new_device"
  | "out_of_region"
  | "account_takeover"
  | "undocumented"
  | "none";

export interface SimilarCaseContract {
  case_id: string;
  similarity: number;
  outcome: "fraud" | "cleared" | "confirmed_fraud";
}

/** Evidence item matching PRD §9 backend contract */
export interface EvidenceContractItem {
  step: string;
  finding: string;
  direction: "concern" | "ease" | "context";
  weight: number;
}

/** PRD §9: Agent output contract */
export interface InvestigationContract {
  case_id: string;
  transaction_id: string;
  card_id: string;
  customer_id?: string;
  verdict: VerdictContract;
  fraud_probability: number;
  uncertainty: UncertaintyContract;
  pattern: FraudPatternContract;
  first_suspicious_txn_id: string | null;
  episode_txn_ids: string[];
  connected_card_ids: string[];
  similar_cases: SimilarCaseContract[];
  evidence: EvidenceContractItem[];
  policy: string;
  next_actions: string[];
  exposure_usd: number;
  rationale: string;
}

/** POST /api/investigate payload */
export interface InvestigateRequest {
  transaction_id: string;
}

/** POST /api/cases/{id}/evidence payload */
export interface AddEvidenceRequest {
  step: string;
  finding: string;
  direction: "concern" | "ease" | "context";
  weight: number;
}

/** GET /api/health response */
export interface HealthStatusContract {
  status: "ok" | "degraded" | "down";
  frontend: "online" | "offline";
  fastapi: "online" | "offline";
  tigergraph: "connected" | "disconnected" | "mock";
  agent: "ready" | "busy" | "offline";
  llm: "ready" | "rate_limited" | "offline";
  dataset: "loaded" | "pending" | "missing";
  timestamp: string;
}

/** Graph contracts matching GET /api/graph/{case_id} */
export interface GraphNodeContract {
  id: string;
  type: "customer" | "card" | "transaction" | "device" | "case";
  label: string;
  flagged?: boolean;
  risk?: "low" | "medium" | "high";
  meta?: Record<string, string | number>;
}

export interface GraphEdgeContract {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface InvestigationGraphContract {
  nodes: GraphNodeContract[];
  edges: GraphEdgeContract[];
}
