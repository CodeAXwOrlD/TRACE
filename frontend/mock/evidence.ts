import type { EvidenceItem } from "@/lib/types";

// Every conclusion must point to evidence (Rules.md #5). This fixture backs
// the CASE-0007 story used across the landing page and workbench mocks.
export const evidenceByInvestigation: Record<string, EvidenceItem[]> = {
  "inv-0007": [
    {
      id: "ev-1",
      type: "transaction",
      severity: "medium",
      timestamp: "2026-09-18T13:41:00Z",
      description: "3 tiny charges 41 minutes before the flagged transaction",
      source: "Card timeline",
      confidence: 0.9,
      tag: "raises_concern",
    },
    {
      id: "ev-2",
      type: "device",
      severity: "high",
      timestamp: "2026-09-18T14:00:00Z",
      description: "Device reused across 4 cards",
      source: "Transaction graph",
      confidence: 0.91,
      tag: "raises_concern",
    },
    {
      id: "ev-3",
      type: "historical_case",
      severity: "high",
      timestamp: "2026-09-18T14:05:00Z",
      description: "2 confirmed fraud cases on the same device: CC-0141, CC-2671",
      source: "Closed-case memory",
      confidence: 0.88,
      tag: "raises_concern",
    },
    {
      id: "ev-4",
      type: "pattern",
      severity: "medium",
      timestamp: "2026-09-18T14:06:00Z",
      description: "Matches card-not-present with a new device",
      source: "Pattern detector: cnp_new_device",
      confidence: 0.82,
      tag: "context",
    },
  ],
  "inv-0012": [
    {
      id: "ev-5",
      type: "device",
      severity: "low",
      timestamp: "2026-09-10T09:00:00Z",
      description: "Known device, seen on this card for 8 months",
      source: "Card baseline",
      confidence: 0.95,
      tag: "lowers_concern",
    },
    {
      id: "ev-6",
      type: "historical_case",
      severity: "low",
      timestamp: "2026-09-10T09:01:00Z",
      description: "3 similar past cases, all cleared",
      source: "Closed-case memory",
      confidence: 0.86,
      tag: "lowers_concern",
    },
  ],
  "inv-0019": [
    {
      id: "ev-7",
      type: "card",
      severity: "medium",
      timestamp: "2026-09-15T11:00:00Z",
      description: "Evidence conflicts: known device, unusual region",
      source: "Card baseline",
      confidence: 0.55,
      tag: "context",
    },
    {
      id: "ev-8",
      type: "transaction",
      severity: "medium",
      timestamp: "2026-09-15T11:02:00Z",
      description: "Exposure is $842, above the auto-decide threshold",
      source: "Policy engine",
      confidence: 0.7,
      tag: "raises_concern",
    },
  ],
};

export function getEvidence(caseOrInvId: string): EvidenceItem[] {
  if (evidenceByInvestigation[caseOrInvId]) {
    return evidenceByInvestigation[caseOrInvId];
  }
  const normalized = caseOrInvId.toLowerCase().replace("case-", "inv-");
  return evidenceByInvestigation[normalized] ?? [];
}
