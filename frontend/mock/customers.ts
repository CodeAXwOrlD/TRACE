import type { Customer } from "@/lib/types";

// Deterministic mock data. Matches Design.md's worked example (CASE-0007 / C12382).
export const customers: Customer[] = [
  {
    id: "C12382",
    riskLevel: "HIGH",
    connectedCards: 3,
    transactionCount: 17,
    deviceCount: 2,
    previousCases: 1,
  },
  {
    id: "C10041",
    riskLevel: "NONE",
    connectedCards: 1,
    transactionCount: 142,
    deviceCount: 1,
    previousCases: 0,
  },
  {
    id: "C10982",
    riskLevel: "MEDIUM",
    connectedCards: 2,
    transactionCount: 34,
    deviceCount: 3,
    previousCases: 2,
  },
];

export function getCustomer(id: string): Customer | undefined {
  return customers.find((c) => c.id === id);
}
