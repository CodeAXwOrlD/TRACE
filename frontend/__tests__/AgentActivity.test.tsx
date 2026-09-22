import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AgentActivity } from "@/components/workbench/AgentActivity";
import type { AgentEvent } from "@/lib/types";

const events: AgentEvent[] = [
  { id: "e0", type: "investigation_started", timestamp: "2026-09-18T14:22:00Z", status: "done", description: "Investigation started" },
  { id: "e1", type: "agent_message", timestamp: "2026-09-18T14:22:01Z", status: "done", description: "Loading transaction" },
];

describe("AgentActivity", () => {
  it("renders every event description and the running state", () => {
    render(<AgentActivity events={events} caseId="CASE-0007" isRunning />);
    expect(screen.getByText("Investigation started")).toBeInTheDocument();
    expect(screen.getByText("Loading transaction")).toBeInTheDocument();
    expect(screen.getByText(/AGENT INVESTIGATING CASE-0007/)).toBeInTheDocument();
  });

  it("shows a waiting placeholder with no events", () => {
    render(<AgentActivity events={[]} caseId="CASE-0007" isRunning={false} />);
    expect(screen.getByText("Waiting to start…")).toBeInTheDocument();
  });
});
