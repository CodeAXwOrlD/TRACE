import type { Transaction } from "@/lib/types";

export const transactions: Transaction[] = [
  {
    id: "txn-flagged",
    timestamp: "2026-09-18T14:22:00Z",
    amount: 128.33,
    channel: "card_not_present",
    cardId: "card-4417",
    deviceId: "device-a9",
    billingRegion: "US-CA",
    emailDomain: "proton.example",
    riskScore: 0.87,
    flagged: true,
  },
  {
    id: "txn-001",
    timestamp: "2026-09-18T13:41:00Z",
    amount: 1.05,
    channel: "card_not_present",
    cardId: "card-4417",
    deviceId: "device-a9",
    billingRegion: "US-CA",
    emailDomain: "proton.example",
    riskScore: 0.41,
    flagged: false,
  },
  {
    id: "txn-002",
    timestamp: "2026-09-18T13:39:00Z",
    amount: 1.2,
    channel: "card_not_present",
    cardId: "card-4417",
    deviceId: "device-a9",
    billingRegion: "US-CA",
    emailDomain: "proton.example",
    riskScore: 0.39,
    flagged: false,
  },
  {
    id: "txn-legit-1",
    timestamp: "2026-09-10T09:00:00Z",
    amount: 64.0,
    channel: "card_present",
    cardId: "card-legit",
    billingRegion: "US-NY",
    emailDomain: "gmail.example",
    riskScore: 0.91,
    flagged: false,
  },
  {
    id: "txn-unsure-1",
    timestamp: "2026-09-15T11:00:00Z",
    amount: 842.0,
    channel: "card_not_present",
    cardId: "card-3308",
    deviceId: "device-3308",
    billingRegion: "US-TX",
    emailDomain: "outlook.example",
    riskScore: 0.58,
    flagged: true,
  },
];

export function getTransaction(id: string): Transaction | undefined {
  return transactions.find((t) => t.id === id);
}

export function transactionsForCard(cardId: string): Transaction[] {
  return transactions
    .filter((t) => t.cardId === cardId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
