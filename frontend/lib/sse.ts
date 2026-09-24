// ============================================================================
// lib/sse.ts — SSE-ready streaming abstraction (project prompt section 13).
//
// Contract (also documented in docs/Architecture.md section 7):
//   GET /api/investigations/:id/stream
// Expected event payloads:
//   { "type": "investigation_started" }
//   { "type": "evidence_found", "data": {...} }
//   { "type": "graph_update", "data": {...} }
//   { "type": "risk_update", "data": {...} }
//   { "type": "agent_message", "data": {...} }
//   { "type": "investigation_complete" }
//
// Today (mock mode) this plays a scripted, deterministic event list on a
// timer. Once Member 2/3's backend exposes the real stream, subscribeToStream
// is the only function that needs to change — components use
// useInvestigationStream() (hooks/useInvestigationStream.ts) and never touch
// EventSource directly.
// ============================================================================

import type { AgentEvent } from "./types";
import { API_BASE, usingLiveBackend } from "./api";

export type StreamHandle = { close: () => void };

export function subscribeToStream(
  investigationOrTxId: string,
  onEvent: (event: AgentEvent) => void,
  onComplete?: () => void
): StreamHandle {
  if (typeof window !== "undefined" && "EventSource" in window) {
    const url = `${API_BASE}/api/investigate/stream?transaction_id=${encodeURIComponent(investigationOrTxId)}`;
    const es = new EventSource(url);
    const handleRaw = (rawData: string) => {
      try {
        const parsed = JSON.parse(rawData);
        const event: AgentEvent = {
          id: parsed.id || `evt_${parsed.type || "agent"}`,
          type: parsed.type || "agent_message",
          timestamp: parsed.timestamp || new Date().toISOString(),
          status: parsed.type === "investigation_complete" ? "done" : "active",
          description: parsed.description || `Processing ${parsed.type || "investigation"}`,
          data: parsed.data,
        };
        onEvent(event);
        if (event.type === "investigation_complete") {
          onComplete?.();
          es.close();
        }
      } catch {
        // Malformed event — ignore rather than crash
      }
    };

    es.onmessage = (msg) => handleRaw(msg.data);

    const eventNames = [
      "investigation_started",
      "evidence_found",
      "graph_analysis_started",
      "graph_analysis_complete",
      "pattern_detected",
      "historical_cases_found",
      "probability_updated",
      "uncertainty_updated",
      "policy_selected",
      "action_generated",
      "investigation_complete",
      "graph_update",
      "risk_update",
      "agent_message",
    ];

    eventNames.forEach((eventName) => {
      es.addEventListener(eventName, (e: MessageEvent) => handleRaw(e.data));
    });
    es.onerror = () => {
      es.close();
      onComplete?.();
    };
    return { close: () => es.close() };
  }

  return {
    close: () => {},
  };
}
