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
  type: "transaction" | "device" | "card" | "customer" | "historical_case" | "pattern";
  severity: EvidenceSeverity;
  timestamp: string;
  description: string;
  source: string;
  confidence: number; // 0..1
  tag: EvidenceTag;
}

export interface RiskAssessment {
  /** Input feature, not the verdict. Rules.md #1. */
  riskScore: number;
  /** Model output, derived from evidence. Never equals riskScore by design in mocks. */
  probability: number;
  uncertainty: Uncertainty;
  verdict: Verdict;
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
}

export interface Investigation {
  id: string;
  caseId: string;
  triggerTransactionId: string;
  cardId?: string;
  customerId: string;
  status: "queued" | "running" | "complete";
  pattern: FraudPattern | null;
  risk: RiskAssessment;
  policy: PolicyDecision | null;
  evidence: EvidenceItem[];
  timeline: Transaction[];
  rationale: string;
  createdAt: string;
  firstSuspiciousTxnId?: string | null;
  episodeTxnIds?: string[];
  connectedCardIds?: string[];
  similarCases?: SimilarCase[];
  exposureUsd?: number;
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
