import type { InvestigationGraphData } from "@/lib/types";

// Capped subgraph shape (Architecture.md §10: UI always receives <= 200 nodes,
// never raw tables). Mirrors the CASE-0007 investigation story with rich metadata.
export const investigationGraph: InvestigationGraphData = {
  nodes: [
    {
      id: "cust-C12382",
      type: "customer",
      label: "C12382",
      risk: "high",
      meta: {
        risk: "HIGH",
        connectedCards: 3,
        transactions: 17,
        devices: 2,
        previousCases: 1,
      },
    },
    {
      id: "card-4417",
      type: "card",
      label: "····4417",
      risk: "high",
      meta: {
        last4: "4417",
        customer: "C12382",
        channel: "Card Not Present",
        billingRegion: "US-CA",
        fraudRisk: "High (Bursts)",
      },
    },
    {
      id: "txn-flagged",
      type: "transaction",
      label: "$128.33",
      flagged: true,
      risk: "high",
      meta: {
        amount: "$128.33",
        channel: "card_not_present",
        riskScore: "0.87 (input)",
        timestamp: "2026-09-18 14:22:00 UTC",
        origin: "Flagged Trigger",
      },
    },
    {
      id: "device-a9",
      type: "device",
      label: "Device A9",
      risk: "high",
      meta: {
        deviceType: "iPhone 15 Pro / iOS 17",
        linkedCards: 4,
        confirmedFraudCases: 2,
        firstSeen: "2026-09-18 13:30 UTC",
      },
    },
    {
      id: "card-0921",
      type: "card",
      label: "····0921",
      meta: {
        last4: "0921",
        status: "Blocked in CC-0141",
        connectedVia: "Shared Device A9",
      },
    },
    {
      id: "card-7754",
      type: "card",
      label: "····7754",
      meta: {
        last4: "7754",
        status: "Blocked in CC-2671",
        connectedVia: "Shared Device A9",
      },
    },
    {
      id: "card-3308",
      type: "card",
      label: "····3308",
      meta: {
        last4: "3308",
        status: "Active monitoring",
        connectedVia: "Shared Device A9",
      },
    },
    {
      id: "case-0141",
      type: "case",
      label: "CC-0141",
      risk: "high",
      meta: {
        outcome: "Confirmed Fraud",
        pattern: "CNP + New Device",
        exposure: "$710.00",
        similarity: "91%",
      },
    },
    {
      id: "case-2671",
      type: "case",
      label: "CC-2671",
      risk: "high",
      meta: {
        outcome: "Confirmed Fraud",
        pattern: "Card Testing",
        exposure: "$1,240.00",
        similarity: "84%",
      },
    },
  ],
  edges: [
    { id: "e1", source: "cust-C12382", target: "card-4417", label: "OWNS" },
    { id: "e2", source: "card-4417", target: "txn-flagged", label: "MADE" },
    { id: "e3", source: "txn-flagged", target: "device-a9", label: "FROM_DEVICE" },
    { id: "e4", source: "device-a9", target: "card-0921", label: "USED_ON" },
    { id: "e5", source: "device-a9", target: "card-7754", label: "USED_ON" },
    { id: "e6", source: "device-a9", target: "card-3308", label: "USED_ON" },
    { id: "e7", source: "card-4417", target: "case-0141", label: "SIMILAR_TO" },
    { id: "e8", source: "card-4417", target: "case-2671", label: "SIMILAR_TO" },
  ],
};

export function getInvestigationGraph(_investigationId: string): InvestigationGraphData {
  return investigationGraph;
}
