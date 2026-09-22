import type { AgentEvent } from "@/lib/types";

// Scripted, deterministic event stream. useInvestigationStream() replays this
// on a timer until Member 2/3 swap in the real SSE endpoint (lib/sse.ts).
export function scriptedAgentEvents(investigationId: string): AgentEvent[] {
  const base = new Date("2026-09-18T14:22:00Z").getTime();
  const at = (offsetMs: number) => new Date(base + offsetMs).toISOString();
  return [
    {
      id: `${investigationId}-e0`,
      type: "investigation_started",
      timestamp: at(0),
      status: "done",
      description: "Investigation started",
    },
    {
      id: `${investigationId}-e1`,
      type: "agent_message",
      timestamp: at(600),
      status: "done",
      description: "Loading transaction",
    },
    {
      id: `${investigationId}-e2`,
      type: "agent_message",
      timestamp: at(1400),
      status: "done",
      description: "Querying customer history",
    },
    {
      id: `${investigationId}-e3`,
      type: "evidence_found",
      timestamp: at(2200),
      status: "done",
      description: "Analyzing device relationships",
    },
    {
      id: `${investigationId}-e4`,
      type: "evidence_found",
      timestamp: at(3000),
      status: "done",
      description: "Searching historical cases",
    },
    {
      id: `${investigationId}-e5`,
      type: "graph_update",
      timestamp: at(3800),
      status: "done",
      description: "Detecting suspicious pattern",
    },
    {
      id: `${investigationId}-e6`,
      type: "risk_update",
      timestamp: at(4600),
      status: "done",
      description: "Calculating risk",
    },
    {
      id: `${investigationId}-e7`,
      type: "agent_message",
      timestamp: at(5400),
      status: "done",
      description: "Generating explanation",
    },
    {
      id: `${investigationId}-e8`,
      type: "investigation_complete",
      timestamp: at(6200),
      status: "done",
      description: "Investigation complete",
    },
  ];
}
