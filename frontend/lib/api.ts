// ============================================================================
// lib/api.ts — API abstraction matching docs/Architecture.md §7.
//
// Endpoints:
//   GET  /api/health
//   GET  /api/cases
//   GET  /api/cases/{id}
//   POST /api/investigate                { "transaction_id": "..." }
//   GET  /api/investigate/stream?transaction_id=...
//   POST /api/cases/{id}/evidence        { "step": "...", "finding": "...", ... }
//   GET  /api/graph/{case_id}
//   POST /api/cases/{id}/close
//
// MOCK vs LIVE:
// - Explicit mode: NEXT_PUBLIC_USE_MOCKS === "true" or !NEXT_PUBLIC_API_URL
//   uses deterministic mock fixtures.
// - Live mode: Calls real FastAPI endpoints. On network failure, it throws
//   an explicit error (no silent mock fallback) so the UI shows an honest
//   error state per Rules.md.
// ============================================================================

import type {
  Case,
  Customer,
  DashboardStats,
  DeviceProfile,
  EvidenceContractItem,
  EvidenceItem,
  HealthStatusContract,
  Investigation,
  InvestigationContract,
  InvestigationGraphContract,
  InvestigationGraphData,
  Transaction,
} from "./types";
import {
  contractToGraphData,
  contractToInvestigationViewModel,
} from "./adapters";
import { cases as mockCases, getCase as mockGetCase, getDashboardStats as mockStats } from "@/mock/cases";
import { getCustomer as mockGetCustomer } from "@/mock/customers";
import {
  getInvestigation as mockGetInvestigation,
  investigations as mockInvestigations,
  mockAddEvidence,
  mockStartInvestigation,
} from "@/mock/investigations";
import { getInvestigationGraph as mockGetGraph } from "@/mock/graph";
import { getEvidence as mockGetEvidence } from "@/mock/evidence";
import { getTransaction as mockGetTransaction } from "@/mock/transactions";
import { getDevice as mockGetDevice } from "@/mock/devices";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
export const FORCE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true" || !API_BASE;
export const usingLiveBackend = !FORCE_MOCKS;
export { API_BASE };

/**
 * Strict fetch helper for Live Mode.
 * NEVER silently falls back to mocks on error when in Live mode.
 */
async function fetchLive<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    throw new Error(`API ${res.status} on ${path}: ${errorBody || res.statusText}`);
  }

  return (await res.json()) as T;
}

// ============================================================================
// 1. System Health: GET /api/health
// ============================================================================
export async function getHealth(): Promise<HealthStatusContract> {
  if (FORCE_MOCKS) {
    return {
      status: "ok",
      frontend: "online",
      fastapi: "online",
      tigergraph: "connected",
      agent: "ready",
      llm: "ready",
      dataset: "loaded",
      timestamp: new Date().toISOString(),
    };
  }
  return fetchLive<HealthStatusContract>("/api/health");
}

// ============================================================================
// 2. Cases: GET /api/cases and GET /api/cases/{id}
// ============================================================================
export async function getCases(): Promise<Case[]> {
  if (FORCE_MOCKS) return mockCases;
  return fetchLive<Case[]>("/api/cases");
}

export async function getCaseById(id: string): Promise<Case | undefined> {
  if (FORCE_MOCKS) return mockGetCase(id);
  return fetchLive<Case>(`/api/cases/${id}`);
}

// ============================================================================
// 3. Start Investigation: POST /api/investigate
// ============================================================================
export async function startInvestigation(transactionId: string): Promise<Investigation> {
  if (FORCE_MOCKS) {
    return mockStartInvestigation(transactionId);
  }
  const contract = await fetchLive<InvestigationContract>("/api/investigate", {
    method: "POST",
    body: JSON.stringify({ transaction_id: transactionId }),
  });
  return contractToInvestigationViewModel(contract);
}

// ============================================================================
// 4. Investigation Graph: GET /api/graph/{case_id}
// ============================================================================
export async function getInvestigationGraph(caseOrInvId: string): Promise<InvestigationGraphData> {
  if (FORCE_MOCKS) {
    return mockGetGraph(caseOrInvId);
  }
  const contract = await fetchLive<InvestigationGraphContract>(`/api/graph/${caseOrInvId}`);
  return contractToGraphData(contract);
}

// ============================================================================
// 5. Add Evidence: POST /api/cases/{id}/evidence
// ============================================================================
export async function addEvidence(
  caseId: string,
  evidence: EvidenceContractItem | EvidenceItem
): Promise<{ success: boolean; investigation: Investigation }> {
  if (FORCE_MOCKS) {
    return mockAddEvidence(caseId, evidence);
  }

  const payload: EvidenceContractItem =
    "step" in evidence
      ? evidence
      : {
          step: evidence.type || "analyst_finding",
          finding: evidence.description,
          direction:
            evidence.tag === "raises_concern"
              ? "concern"
              : evidence.tag === "lowers_concern"
              ? "ease"
              : "context",
          weight: evidence.confidence,
        };

  const updatedContract = await fetchLive<InvestigationContract>(`/api/cases/${caseId}/evidence`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return {
    success: true,
    investigation: contractToInvestigationViewModel(updatedContract),
  };
}

// ============================================================================
// 6. Close Case: POST /api/cases/{id}/close
// ============================================================================
export async function closeCase(caseId: string): Promise<{ success: boolean }> {
  if (FORCE_MOCKS) {
    return { success: true };
  }
  return fetchLive<{ success: boolean }>(`/api/cases/${caseId}/close`, {
    method: "POST",
  });
}

// ============================================================================
// 7. Context Lookups & Details (Customer, Device, Transaction, Dashboard)
// ============================================================================
export async function getTransaction(id: string): Promise<Transaction | undefined> {
  if (FORCE_MOCKS) return mockGetTransaction(id);
  return fetchLive<Transaction>(`/api/transactions/${id}`);
}

export async function getCustomer(id: string): Promise<Customer | undefined> {
  if (FORCE_MOCKS) return mockGetCustomer(id);
  return fetchLive<Customer>(`/api/customers/${id}`);
}

export async function getDevice(id: string): Promise<DeviceProfile | undefined> {
  if (FORCE_MOCKS) return mockGetDevice(id);
  return fetchLive<DeviceProfile>(`/api/devices/${id}`);
}

export async function getInvestigations(): Promise<Investigation[]> {
  if (FORCE_MOCKS) return mockInvestigations;
  const raw = await fetchLive<unknown[]>("/api/investigations");
  return raw.map((r) => contractToInvestigationViewModel(r));
}

export async function getInvestigation(id: string): Promise<Investigation | undefined> {
  if (FORCE_MOCKS) return mockGetInvestigation(id);
  const contract = await fetchLive<InvestigationContract>(`/api/investigations/${id}`);
  return contractToInvestigationViewModel(contract);
}

export async function getEvidence(caseIdOrInvId: string): Promise<EvidenceItem[]> {
  if (FORCE_MOCKS) return mockGetEvidence(caseIdOrInvId);
  return fetchLive<EvidenceItem[]>(`/api/cases/${caseIdOrInvId}/evidence`);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (FORCE_MOCKS) return mockStats();
  return fetchLive<DashboardStats>("/api/dashboard/stats");
}
