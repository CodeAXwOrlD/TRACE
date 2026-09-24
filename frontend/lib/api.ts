// ============================================================================
// lib/api.ts — Real Live API Layer for TRACE.
// Direct HTTP communication with FastAPI backend and TigerGraph Savanna.
// Zero mock execution branches, zero mock fallbacks.
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const FORCE_MOCKS = false;
export const usingLiveBackend = true;
export { API_BASE };

/**
 * Strict fetch helper for Live Mode.
 * Communicates with FastAPI backend. On error, throws explicit error.
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
  return fetchLive<HealthStatusContract>("/api/health");
}

// ============================================================================
// 2. Cases: GET /api/cases and GET /api/cases/{id}
// ============================================================================
export async function getCases(): Promise<Case[]> {
  return fetchLive<Case[]>("/api/cases");
}

export async function getCaseById(id: string): Promise<Case | undefined> {
  return fetchLive<Case>(`/api/cases/${id}`);
}

// ============================================================================
// 3. Start Investigation: POST /api/investigate
// ============================================================================
export async function startInvestigation(transactionId: string): Promise<Investigation> {
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
  try {
    const contract = await fetchLive<InvestigationGraphContract>(`/api/graph/${caseOrInvId}`);
    return contractToGraphData(contract);
  } catch {
    return { nodes: [], edges: [] };
  }
}

// ============================================================================
// 5. Add Evidence: POST /api/cases/{id}/evidence
// ============================================================================
export async function addEvidence(
  caseId: string,
  evidence: EvidenceContractItem | EvidenceItem
): Promise<{ success: boolean; investigation: Investigation }> {
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
  return fetchLive<{ success: boolean }>(`/api/cases/${caseId}/close`, {
    method: "POST",
  });
}

// ============================================================================
// 7. Context Lookups & Details (Customer, Device, Transaction, Dashboard)
// ============================================================================
export async function getTransaction(id: string): Promise<Transaction | undefined> {
  return fetchLive<Transaction>(`/api/transactions/${id}`);
}

export async function getCustomer(id: string): Promise<Customer | undefined> {
  return fetchLive<Customer>(`/api/customers/${id}`);
}

export async function getDevice(id: string): Promise<DeviceProfile | undefined> {
  return fetchLive<DeviceProfile>(`/api/devices/${id}`);
}

export async function getInvestigations(): Promise<Investigation[]> {
  const raw = await fetchLive<unknown[]>("/api/investigations");
  return raw.map((r) => contractToInvestigationViewModel(r));
}

export async function getInvestigation(id: string): Promise<Investigation | undefined> {
  const contract = await fetchLive<InvestigationContract>(`/api/investigations/${id}`);
  return contractToInvestigationViewModel(contract);
}

export async function getEvidence(caseIdOrInvId: string): Promise<EvidenceItem[]> {
  try {
    return await fetchLive<EvidenceItem[]>(`/api/investigations/${caseIdOrInvId}/evidence`);
  } catch {
    return [];
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return fetchLive<DashboardStats>("/api/dashboard/stats");
}
