import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RiskScore } from "@/components/workbench/RiskScore";
import type { RiskAssessment } from "@/lib/types";

const risk: RiskAssessment = { riskScore: 0.87, probability: 0.82, uncertainty: "MEDIUM", verdict: "FRAUD" };

describe("RiskScore", () => {
  it("renders the verdict badge and both bar labels, never mislabeling risk_score as the probability", () => {
    render(<RiskScore risk={risk} />);
    expect(screen.getByText("Fraud")).toBeInTheDocument();
    expect(screen.getByText(/Risk score \(input only\)/)).toBeInTheDocument();
    expect(screen.getAllByText(/Fraud probability/).length).toBeGreaterThan(0);
    expect(screen.getByText("0.87")).toBeInTheDocument();
    expect(screen.getByText("0.82")).toBeInTheDocument();
  });
});
