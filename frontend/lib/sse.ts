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
import { scriptedAgentEvents } from "@/mock/agentEvents";

export type StreamHandle = { close: () => void };

export function subscribeToStream(
  investigationOrTxId: string,
  onEvent: (event: AgentEvent) => void,
  onComplete?: () => void
): StreamHandle {
  if (usingLiveBackend && typeof window !== "undefined" && "EventSource" in window) {
    const url = `${API_BASE}/api/investigate/stream?transaction_id=${encodeURIComponent(investigationOrTxId)}`;
    const es = new EventSource(url);
    es.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data) as AgentEvent;
        onEvent(event);
        if (event.type === "investigation_complete") {
          onComplete?.();
          es.close();
        }
      } catch {
        // Malformed event — ignore rather than crash the panel (Rules.md error handling).
      }
    };
    es.onerror = () => {
      es.close();
      // Backend stream dropped; caller can fall back to the mock stream if desired.
    };
    return { close: () => es.close() };
  }

  // Mock stream: replay scripted events with realistic spacing.
  const events = scriptedAgentEvents(investigationOrTxId);
  let cancelled = false;
  let i = 0;
  const step = () => {
    if (cancelled || i >= events.length) return;
    const event = events[i]!;
    onEvent(event);
    i++;
    if (event.type === "investigation_complete") {
      onComplete?.();
      return;
    }
    setTimeout(step, 550 + Math.random() * 350);
  };
  const timer = setTimeout(step, 400);
  return {
    close: () => {
      cancelled = true;
      clearTimeout(timer);
    },
  };
}
