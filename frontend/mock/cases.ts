import type { Case, DashboardStats } from "@/lib/types";
import { investigations } from "./investigations";

export const cases: Case[] = investigations.map((inv) => ({
  id: inv.caseId,
  investigationId: inv.id,
  verdict: inv.risk.verdict,
  exposureUsd: inv.exposureUsd ?? 0,
  openedAt: inv.createdAt,
  updatedAt: inv.createdAt,
  summary: inv.rationale,
}));

export function getCase(id: string): Case | undefined {
  return cases.find((c) => c.id === id);
}

export function getDashboardStats(): DashboardStats {
  return {
    activeCases: cases.filter((c) => c.verdict === "PENDING" || c.verdict === "UNCERTAIN").length,
    highRisk: cases.filter((c) => c.verdict === "FRAUD").length,
    investigations: investigations.length,
    resolved: cases.filter((c) => c.verdict === "FRAUD" || c.verdict === "LEGITIMATE").length,
  };
}
