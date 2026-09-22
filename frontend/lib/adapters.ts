// ============================================================================
// lib/adapters.ts — Bidirectional mappers between backend PRD contracts
// (lib/contracts.ts) and frontend view models (lib/types.ts).
// ============================================================================

import type {
  EvidenceContractItem,
  InvestigationContract,
  InvestigationGraphContract,
} from "./contracts";
import type {
  EvidenceItem,
  EvidenceSeverity,
  EvidenceTag,
  FraudPattern,
  Investigation,
  InvestigationGraphData,
  PolicyDecision,
  RiskAssessment,
  Transaction,
  Uncertainty,
  Verdict,
} from "./types";

/** Maps backend PRD Evidence item to frontend view-model */
export function contractToEvidenceItem(item: EvidenceContractItem, index = 0): EvidenceItem {
  const severity: EvidenceSeverity =
    item.direction === "concern" ? "high" : item.direction === "ease" ? "low" : "medium";
  const tag: EvidenceTag =
    item.direction === "concern"
      ? "raises_concern"
      : item.direction === "ease"
      ? "lowers_concern"
      : "context";

  return {
    id: `ev-${index}-${item.step}`,
    type: (item.step as EvidenceItem["type"]) || "pattern",
    severity,
    timestamp: new Date().toISOString(),
    description: item.finding,
    source: item.step.replace(/_/g, " ").toUpperCase(),
    confidence: Math.min(Math.max(item.weight, 0.1), 0.99),
    tag,
  };
}

/** Maps frontend EvidenceItem to backend PRD contract format */
export function evidenceItemToContract(item: EvidenceItem): EvidenceContractItem {
  const direction =
    item.tag === "raises_concern"
      ? "concern"
      : item.tag === "lowers_concern"
      ? "ease"
      : "context";

  return {
    step: item.type || "analyst_finding",
    finding: item.description,
    direction,
    weight: item.confidence,
  };
}

/** Maps backend PRD Investigation contract to frontend Investigation view model */
export function contractToInvestigationViewModel(
  contract: InvestigationContract,
  extra: {
    customerId?: string;
    timeline?: Transaction[];
    createdAt?: string;
  } = {}
): Investigation {
  const risk: RiskAssessment = {
    riskScore: 0.85, // Input feature
    probability: contract.fraud_probability,
    uncertainty: contract.uncertainty as Uncertainty,
    verdict: contract.verdict as Verdict,
  };

  const policy: PolicyDecision = {
    policyId: contract.policy,
    actions: contract.next_actions,
  };

  const evidence = contract.evidence.map((e, i) => contractToEvidenceItem(e, i));

  return {
    id: contract.case_id.toLowerCase().replace("case", "inv"),
    caseId: contract.case_id,
    triggerTransactionId: contract.transaction_id,
    cardId: contract.card_id,
    customerId: extra.customerId || `C-${contract.card_id.slice(-4)}`,
    status: "complete",
    pattern: (contract.pattern === "none" ? null : contract.pattern) as FraudPattern | null,
    risk,
    policy,
    evidence,
    timeline: extra.timeline || [],
    rationale: contract.rationale,
    createdAt: extra.createdAt || new Date().toISOString(),
    firstSuspiciousTxnId: contract.first_suspicious_txn_id,
    episodeTxnIds: contract.episode_txn_ids,
    connectedCardIds: contract.connected_card_ids,
    similarCases: contract.similar_cases.map((sc) => ({
      caseId: sc.case_id,
      similarity: sc.similarity,
      outcome: sc.outcome,
    })),
    exposureUsd: contract.exposure_usd,
  };
}

/** Maps backend graph contract to frontend graph view-model */
export function contractToGraphData(contract: InvestigationGraphContract): InvestigationGraphData {
  return {
    nodes: contract.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      label: n.label,
      flagged: n.flagged,
      risk: n.risk,
      meta: n.meta,
    })),
    edges: contract.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
    })),
  };
}
