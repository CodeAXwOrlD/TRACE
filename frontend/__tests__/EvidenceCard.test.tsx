import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EvidenceCard } from "@/components/workbench/EvidenceCard";
import type { EvidenceItem } from "@/lib/types";

const evidence: EvidenceItem = {
  id: "ev-1",
  type: "device",
  severity: "high",
  timestamp: "2026-09-18T14:00:00Z",
  description: "Device reused across 4 cards",
  source: "Transaction graph",
  confidence: 0.91,
  tag: "raises_concern",
};

describe("EvidenceCard", () => {
  it("shows the description, source and confidence", () => {
    render(<EvidenceCard evidence={evidence} />);
    expect(screen.getByText("Device reused across 4 cards")).toBeInTheDocument();
    expect(screen.getByText("Transaction graph")).toBeInTheDocument();
    expect(screen.getByText("Confidence 91%")).toBeInTheDocument();
  });
});
