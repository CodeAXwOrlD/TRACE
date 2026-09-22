import type { EvidenceContractItem, EvidenceItem, Investigation } from "@/lib/types";
import { contractToEvidenceItem } from "@/lib/adapters";
import { getEvidence } from "./evidence";
import { getTransaction, transactionsForCard } from "./transactions";

export const investigations: Investigation[] = [
  {
    id: "inv-0007",
    caseId: "CASE-0007",
    triggerTransactionId: "txn-flagged",
    cardId: "card-4417",
    customerId: "C12382",
    status: "complete",
    pattern: "cnp_new_device",
    risk: { riskScore: 0.87, probability: 0.82, uncertainty: "MEDIUM", verdict: "FRAUD" },
    policy: { policyId: "R6", actions: ["BLOCK_CARD", "FILE_REPORT", "MONITOR_CONNECTED_CARDS"] },
    evidence: getEvidence("inv-0007"),
    timeline: transactionsForCard("card-4417"),
    rationale:
      "Shared device with two confirmed fraud cases, plus a burst of small charges immediately before the flagged transaction on a newly observed device.",
    createdAt: "2026-09-18T14:22:00Z",
    firstSuspiciousTxnId: "txn-002",
    episodeTxnIds: ["txn-002", "txn-001", "txn-flagged"],
    connectedCardIds: ["card-0921", "card-7754", "card-3308"],
    similarCases: [
      { caseId: "CC-0141", similarity: 0.91, outcome: "confirmed_fraud" },
      { caseId: "CC-2671", similarity: 0.84, outcome: "confirmed_fraud" },
    ],
    exposureUsd: 130.58,
  },
  {
    id: "inv-0012",
    caseId: "CASE-0012",
    triggerTransactionId: "txn-legit-1",
    cardId: "card-legit",
    customerId: "C10041",
    status: "complete",
    pattern: null,
    risk: { riskScore: 0.91, probability: 0.09, uncertainty: "LOW", verdict: "LEGITIMATE" },
    policy: { policyId: "R2", actions: ["CLOSE_NO_FRAUD"] },
    evidence: getEvidence("inv-0012"),
    timeline: transactionsForCard("card-legit"),
    rationale:
      "Recurring behaviour on a known device. High risk score is a false-positive artifact of amount threshold; similar past cases were cleared.",
    createdAt: "2026-09-10T09:00:00Z",
    firstSuspiciousTxnId: null,
    episodeTxnIds: [],
    connectedCardIds: [],
    similarCases: [{ caseId: "CC-0089", similarity: 0.88, outcome: "cleared" }],
    exposureUsd: 64.0,
  },
  {
    id: "inv-0019",
    caseId: "CASE-0019",
    triggerTransactionId: "txn-unsure-1",
    cardId: "card-3308",
    customerId: "C10982",
    status: "complete",
    pattern: "undocumented",
    risk: { riskScore: 0.58, probability: 0.51, uncertainty: "HIGH", verdict: "UNCERTAIN" },
    policy: { policyId: "R9", actions: ["ESCALATE_TO_ANALYST"] },
    evidence: getEvidence("inv-0019"),
    timeline: transactionsForCard("card-3308"),
    rationale: "The evidence conflicts and exposure is $842, so a person decides.",
    createdAt: "2026-09-15T11:00:00Z",
    firstSuspiciousTxnId: "txn-unsure-1",
    episodeTxnIds: ["txn-unsure-1"],
    connectedCardIds: ["card-4417"],
    similarCases: [
      { caseId: "CC-1102", similarity: 0.72, outcome: "cleared" },
      { caseId: "CC-0941", similarity: 0.69, outcome: "confirmed_fraud" },
    ],
    exposureUsd: 842.0,
  },
];

export function getInvestigation(id: string): Investigation | undefined {
  return investigations.find((i) => i.id === id || i.caseId === id);
}

/** Mock intake: resolves any transaction_id to a fully structured Investigation */
export function mockStartInvestigation(transactionId: string): Investigation {
  const existing = investigations.find((i) => i.triggerTransactionId === transactionId);
  if (existing) return existing;

  const txn = getTransaction(transactionId);
  if (txn) {
    if (txn.cardId === "card-legit") return investigations[1]!;
    if (txn.cardId === "card-3308") return investigations[2]!;
  }
  // Default to worked example
  return investigations[0]!;
}

/** Mock add-evidence: dynamically updates evidence and re-scores probability */
export function mockAddEvidence(
  caseId: string,
  rawItem: EvidenceContractItem | EvidenceItem
): { success: boolean; investigation: Investigation } {
  const inv = investigations.find((i) => i.caseId === caseId || i.id === caseId) ?? investigations[0]!;

  const item: EvidenceItem =
    "step" in rawItem
      ? contractToEvidenceItem(rawItem, inv.evidence.length + 1)
      : rawItem;

  // Add evidence item
  inv.evidence = [item, ...inv.evidence];

  // Recalculate probability based on evidence direction
  if (item.tag === "lowers_concern") {
    inv.risk.probability = Math.max(0.05, Math.round((inv.risk.probability - 0.14) * 100) / 100);
    if (inv.risk.probability < 0.35) {
      inv.risk.verdict = "LEGITIMATE";
      inv.risk.uncertainty = "LOW";
      inv.policy = { policyId: "R2", actions: ["CLOSE_NO_FRAUD"] };
    }
  } else if (item.tag === "raises_concern") {
    inv.risk.probability = Math.min(0.98, Math.round((inv.risk.probability + 0.08) * 100) / 100);
    if (inv.risk.probability > 0.7) {
      inv.risk.verdict = "FRAUD";
      inv.risk.uncertainty = "LOW";
    }
  }

  return { success: true, investigation: { ...inv } };
}
