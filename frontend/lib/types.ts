// Shared types. These mirror the future FastAPI result contract
// (Architecture.md section 3, PRD.md section 9 — VERIFY against dataset README
// before backend wiring). Member 2/3: keep this file and backend/app/schemas.py
// in lockstep; treat this as the source of truth for shapes, not names/values.

export type Verdict = "FRAUD" | "LEGITIMATE" | "UNCERTAIN";
export type Uncertainty = "LOW" | "MEDIUM" | "HIGH";
export type EvidenceTag = "raises_concern" | "lowers_concern" | "context";
export type EvidenceSeverity = "low" | "medium" | "high";

export type FraudPattern =
  | "card_testing"
  | "cnp"
  | "cnp_new_device"
  | "out_of_region"
  | "account_takeover"
  | "undocumented";

export interface Customer {
  id: string;
  riskLevel: Uncertainty | "NONE";
  connectedCards: number;
  transactionCount: number;
  deviceCount: number;
  previousCases: number;
}

export interface Card {
  id: string;
  last4: string;
  customerId: string;
}

export interface DeviceProfile {
  id: string;
  deviceType: string;
  deviceInfo: string;
  cardsSeenOn: string[];
}

export interface Transaction {
  id: string;
  timestamp: string; // ISO
  amount: number;
  channel: string;
  cardId: string;
  deviceId?: string;
  billingRegion: string;
  emailDomain: string;
  /** One input, never a probability. Rules.md #1. */
  riskScore: number;
  flagged: boolean;
}

export interface ClosedCase {
  id: string;
  outcome: "confirmed_fraud" | "cleared";
  pattern: FraudPattern;
  exposureUsd: number;
  analystNotes?: string;
}

export interface EvidenceItem {
  id: string;
  type: "transaction" | "device" | "card" | "customer" | "historical_case" | "pattern" | string;
  severity: EvidenceSeverity;
  timestamp: string;
  description: string;
  source: string;
  confidence: number; // 0..1
  tag: EvidenceTag;
  claim?: string;
  finding?: string;
  entities?: string[];
  whyItMatters?: string;
}

export interface RiskAssessment {
  /** Input feature from bank's ML model, not the final verdict. */
  riskScore: number;
  /** Investigation-derived calibrated fraud probability (0..1), if calculated. */
  probability: number | null;
  uncertainty: Uncertainty;
  verdict: Verdict | "PENDING";
}

export interface PolicyRuleDetail {
  rule: string;
  title: string;
  condition: string;
  action: string;
  route: string;
}

export interface RecommendationItem {
  action: string;
  route: string;
  policy: string;
  reason: string;
  status: string;
}

export interface UncertaintyAssessment {
  confidence: number;
  uncertainty: string;
  conflicting_evidence: string[];
  missing_evidence: string[];
  why_needed: string;
  evidence_request?: {
    type: string;
    requested_after_step: string;
    assumed_response: string;
    impact: string;
  };
}

export interface TimelineStepItem {
  step: number;
  title: string;
  action: string;
  result: string;
  timestamp: string;
  status: string;
}

export interface PolicyDecision {
  policyId: string;
  actions: string[]; // e.g. BLOCK_CARD, FILE_REPORT, ESCALATE_TO_ANALYST
}

export interface AgentEvent {
  id: string;
  type:
    | "investigation_started"
    | "evidence_found"
    | "graph_update"
    | "risk_update"
    | "agent_message"
    | "investigation_complete";
  timestamp: string;
  status: "pending" | "active" | "done";
  description: string;
  data?: unknown;
}

export interface GraphNode {
  id: string;
  type: "customer" | "card" | "transaction" | "device" | "case";
  label: string;
  flagged?: boolean;
  risk?: EvidenceSeverity;
  meta?: Record<string, string | number>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface InvestigationGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface SimilarCase {
  caseId: string;
  similarity: number;
  outcome: string;
  reason?: string;
  pattern?: string;
  exposureUsd?: number;
}

export interface Investigation {
  id: string;
  caseId: string;
  triggerTransactionId: string;
  triggerType?: string;
  cardId?: string;
  customerId: string;
  status: string;
  pattern: FraudPattern | string | null;
  risk: RiskAssessment;
  policy: PolicyDecision | null;
  policyDetail?: PolicyRuleDetail;
  evidence: EvidenceItem[];
  timeline: Transaction[];
  timelineSteps?: TimelineStepItem[];
  rationale: string;
  createdAt: string;
  firstSuspiciousTxnId?: string | null;
  episodeTxnIds?: string[];
  connectedCardIds?: string[];
  similarCases?: SimilarCase[];
  exposureUsd?: number;
  riskScore?: number;
  fraudProbability?: number | null;
  stopReason?: string;
  approvalRoute?: string;
  sarRequired?: boolean;
  sarNarrative?: string | null;
  writtenToGraph?: boolean;
  graphCaseId?: string;
  initialRecommendation?: RecommendationItem;
  updatedRecommendation?: RecommendationItem;
  whatChanged?: string;
  uncertaintyAssessment?: UncertaintyAssessment;
}

export interface Case {
  id: string;
  investigationId: string | null;
  verdict: Verdict | "PENDING";
  exposureUsd: number;
  openedAt: string;
  updatedAt: string;
  summary: string;
}

export interface DashboardStats {
  activeCases: number;
  highRisk: number;
  investigations: number;
  resolved: number;
}

export * from "./contracts";
export * from "./adapters";
