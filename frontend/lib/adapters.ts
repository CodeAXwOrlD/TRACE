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
export function contractToEvidenceItem(item: any, index = 0): EvidenceItem {
  const severity: EvidenceSeverity =
    item.direction === "concern" ? "high" : item.direction === "ease" ? "low" : "medium";
  const tag: EvidenceTag =
    item.direction === "concern"
      ? "raises_concern"
      : item.direction === "ease"
      ? "lowers_concern"
      : "context";

  const claimText = item.claim || item.finding || item.description || "";

  return {
    id: item.id || `ev-${index}-${item.step || "signal"}`,
    type: (item.step as EvidenceItem["type"]) || "pattern",
    severity,
    timestamp: item.timestamp || new Date().toISOString(),
    description: claimText,
    claim: claimText,
    finding: claimText,
    source: item.source || (item.step ? item.step.replace(/_/g, " ").toUpperCase() : "EVIDENCE"),
    confidence: typeof item.weight === "number" ? Math.min(Math.max(item.weight, 0.05), 0.99) : 0.75,
    tag,
    entities: item.entities || [],
    whyItMatters: item.why_it_matters || item.whyItMatters,
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
export function contractToInvestigationViewModel(
  contract: any,
  extra: {
    customerId?: string;
    timeline?: Transaction[];
    createdAt?: string;
  } = {}
): Investigation {
  // Distinguish risk score (input) vs calibrated fraud probability (output)
  const rawProbability = contract.fraud_probability ?? contract.fraudProbability;
  const fraudProbability: number | null =
    rawProbability !== undefined && rawProbability !== null ? Number(rawProbability) : null;

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
  const inputRiskScore: number = contract.risk_score ?? contract.riskScore ?? rawRisk.riskScore ?? 0.0;
  const verdictRaw: string =
    contract.verdict ?? rawRisk.verdict ?? "uncertain";
  const uncertainty: string =
    contract.uncertainty ?? rawRisk.uncertainty ?? "high";

  const risk: RiskAssessment = {
    riskScore: inputRiskScore,
    probability: fraudProbability,
    uncertainty: uncertainty as Uncertainty,
    verdict: verdictRaw as Verdict,
  };

  const policy: PolicyDecision = {
    policyId: contract.policy ?? "",
    actions: contract.next_actions ?? contract.nextActions ?? [],
  };

  const evidence: EvidenceItem[] = (contract.evidence ?? []).map(
    (e: any, i: number) => contractToEvidenceItem(e, i)
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
    riskScore: inputRiskScore,
    fraudProbability,
    policy,
    policyDetail: contract.policy_detail ?? contract.policyDetail,
    evidence,
    timeline: extra.timeline ?? contract.timeline ?? [],
    timelineSteps: contract.timeline_steps ?? contract.timelineSteps ?? [],
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
    similarCases: (contract.similar_cases ?? contract.similarCases ?? []).map(
      (sc: any) => ({
        caseId: sc.case_id ?? sc.caseId,
        similarity: sc.similarity,
        outcome: sc.outcome,
        reason: sc.reason,
        pattern: sc.pattern,
        exposureUsd: sc.exposure_usd ?? sc.exposureUsd,
      })
    ),
    exposureUsd: contract.exposure_usd ?? contract.exposureUsd ?? 0,
    stopReason: contract.stop_reason ?? contract.stopReason,
    approvalRoute: contract.approval_route ?? contract.approvalRoute ?? "AUTOMATED",
    sarRequired: contract.sar_required ?? contract.sarRequired ?? false,
    sarNarrative: contract.sar_narrative ?? contract.sarNarrative ?? null,
    writtenToGraph: contract.written_to_graph ?? contract.writtenToGraph ?? true,
    graphCaseId: contract.graph_case_id ?? contract.graphCaseId ?? caseId,
    initialRecommendation: contract.initial_recommendation ?? contract.initialRecommendation,
    updatedRecommendation: contract.updated_recommendation ?? contract.updatedRecommendation,
    whatChanged: contract.what_changed ?? contract.whatChanged,
    uncertaintyAssessment: contract.uncertainty_assessment ?? contract.uncertaintyAssessment,
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
