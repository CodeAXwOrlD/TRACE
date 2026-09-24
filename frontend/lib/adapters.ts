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

/** Maps backend PRD Investigation contract to frontend Investigation view model.
 *  Handles both snake_case (agent output) and camelCase (dataset_loader stubs),
 *  and real HHG-xxx case IDs alongside demo CASE-000x IDs.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function contractToInvestigationViewModel(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  extra: {
    customerId?: string;
    timeline?: Transaction[];
    createdAt?: string;
  } = {}
): Investigation {
  // Support both snake_case (agent output) and camelCase (quick stubs from dataset_loader)
  const fraudProbability: number =
    contract.fraud_probability ?? contract.fraudProbability ?? 0;
  const caseId: string = contract.case_id ?? contract.caseId ?? "";
  const cardId: string = contract.card_id ?? contract.cardId ?? "";
  const customerId: string =
    contract.customer_id ??
    contract.customerId ??
    extra.customerId ??
    `C-${cardId.slice(-4)}`;
  const txnId: string =
    contract.transaction_id ??
    contract.triggerTransactionId ??
    contract.flaggedTxnId ??
    "";
  const rawRisk = contract.risk ?? {};
  const verdictRaw: string =
    contract.verdict ?? rawRisk.verdict ?? "uncertain";
  const uncertainty: string =
    contract.uncertainty ?? rawRisk.uncertainty ?? "high";

  const risk: RiskAssessment = {
    riskScore: fraudProbability,
    probability: fraudProbability,
    uncertainty: uncertainty as Uncertainty,
    verdict: verdictRaw as Verdict,
  };

  const policy: PolicyDecision = {
    policyId: contract.policy ?? "",
    actions: contract.next_actions ?? [],
  };

  const evidence: EvidenceItem[] = (contract.evidence ?? []).map(
    (e: EvidenceContractItem, i: number) => contractToEvidenceItem(e, i)
  );

  // ID conversion: HHG-001 → inv-hhg-001, CASE-0007 → inv-0007
  const invId = caseId
    .toLowerCase()
    .replace(/^hhg-/, "inv-hhg-")
    .replace(/^case-/, "inv-");

  return {
    id: invId,
    caseId,
    triggerTransactionId: txnId,
    cardId,
    customerId,
    status: contract.status ?? "open",
    pattern: (contract.pattern === "none" ? null : contract.pattern) as FraudPattern | null,
    risk,
    policy,
    evidence,
    timeline: extra.timeline ?? contract.timeline ?? [],
    rationale: contract.rationale ?? contract.summary ?? "",
    createdAt:
      extra.createdAt ??
      contract.created_at ??
      contract.createdAt ??
      contract.openedAt ??
      new Date().toISOString(),
    firstSuspiciousTxnId:
      contract.first_suspicious_txn_id ??
      contract.firstSuspiciousTxnId ??
      txnId,
    episodeTxnIds:
      contract.episode_txn_ids ??
      contract.episodeTxnIds ??
      (txnId ? [txnId] : []),
    connectedCardIds:
      contract.connected_card_ids ??
      contract.connectedCardIds ??
      [],
    similarCases: (contract.similar_cases ?? []).map(
      (sc: { case_id: string; similarity: number; outcome: string }) => ({
        caseId: sc.case_id,
        similarity: sc.similarity,
        outcome: sc.outcome,
      })
    ),
    exposureUsd: contract.exposure_usd ?? contract.exposureUsd ?? 0,
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
