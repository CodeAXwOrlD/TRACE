"use client";

import { useState } from "react";
import type {
  EvidenceContractItem,
  EvidenceItem,
  GraphNode,
  Investigation,
  InvestigationGraphData,
} from "@/lib/types";
import { InvestigationHeader } from "./InvestigationHeader";
import { InvestigationSummary } from "./InvestigationSummary";
import { WhySuspiciousSection } from "./WhySuspiciousSection";
import { NodeDetails } from "./NodeDetails";
import { InvestigationTimelineSection } from "./InvestigationTimelineSection";
import { UncertaintySection } from "./UncertaintySection";
import { NextBestActionSection } from "./NextBestActionSection";
import { PolicyExplanationSection } from "./PolicyExplanationSection";
import { PriorCaseMemorySection } from "./PriorCaseMemorySection";
import { SarSection } from "./SarSection";
import { AgentExecutionDetailsSection } from "./AgentExecutionDetailsSection";
import { AddEvidenceDialog } from "./AddEvidenceDialog";
import { addEvidence as apiAddEvidence } from "@/lib/api";
import dynamic from "next/dynamic";

// High-fidelity TigerGraph Subgraph Canvas
const InvestigationGraph = dynamic(
  () => import("@/components/graph/InvestigationGraph").then((m) => m.InvestigationGraph),
  {
    ssr: false,
    loading: () => (
      <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-muted font-mono text-xs bg-[#070a0f] rounded-xl border border-white/10">
        <div className="w-8 h-8 rounded-full border-2 border-orange border-t-transparent animate-spin mb-3" />
        <span>Initializing TigerGraph FraudCaseGraph Subgraph…</span>
      </div>
    ),
  }
);

export interface InvestigationWorkspaceProps {
  investigation: Investigation;
  graph: InvestigationGraphData;
  evidence: EvidenceItem[];
}

/**
 * Analyst-Grade Fraud Investigation Workspace & Graph Intelligence Console:
 * 10 Defensible Sections:
 *   1. Executive Investigation Summary
 *   2. Why This Case Is Suspicious (Empirical Evidence Cards)
 *   3. Graph Investigation (Canvas + Vertex Inspector)
 *   4. Investigation Timeline (Multi-Step Agent Progression)
 *   5. Uncertainty Assessment & Evidence Request
 *   6. Next Best Action (Initial vs Updated + What Changed)
 *   7. Policy Explanation (Institutional R1-R10 Rules)
 *   8. Prior Case Memory (Precedents from Closed History)
 *   9. Suspicious Activity Report (FinCEN SAR / BSA Compliance)
 *  10. Technical Agent Details (LangGraph Trace & State Inspector)
 */
export function InvestigationWorkspace({
  investigation: initialInvestigation,
  graph,
  evidence: initialEvidence,
}: InvestigationWorkspaceProps) {
  const [investigation, setInvestigation] = useState<Investigation>(initialInvestigation);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [addEvidenceOpen, setAddEvidenceOpen] = useState(false);

  const handleAddEvidence = async (item: EvidenceContractItem) => {
    try {
      const res = await apiAddEvidence(investigation.caseId, item);
      if (res.success && res.investigation) {
        setInvestigation({ ...res.investigation });
      }
    } catch (err) {
      console.error("Failed to add evidence:", err);
    } finally {
      setAddEvidenceOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* ==================================================================== */}
      {/* COMMAND HEADER                                                       */}
      {/* ==================================================================== */}
      <InvestigationHeader
        investigation={investigation}
        onAddEvidenceClick={() => setAddEvidenceOpen(true)}
      />

      {/* ==================================================================== */}
      {/* SECTION 1: INVESTIGATION SUMMARY                                     */}
      {/* ==================================================================== */}
      <InvestigationSummary investigation={investigation} />

      {/* ==================================================================== */}
      {/* SECTION 2: WHY THIS CASE IS SUSPICIOUS (EVIDENCE CARDS)              */}
      {/* ==================================================================== */}
      <WhySuspiciousSection
        investigation={investigation}
        onAddEvidenceClick={() => setAddEvidenceOpen(true)}
      />

      {/* ==================================================================== */}
      {/* SECTION 3: GRAPH INVESTIGATION & SUBGRAPH TOPOLOGY                   */}
      {/* ==================================================================== */}
      <section className="rounded-xl border border-white/[.08] bg-[#0c1017]/90 p-5 shadow-xl backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/[.06]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-wider text-muted uppercase font-semibold">
                SECTION 03 · GRAPH INTELLIGENCE
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold">
                {graph.nodes.length} Vertices · {graph.edges.length} Edges
              </span>
            </div>
            <h2 className="text-sm font-semibold text-white tracking-tight">
              TigerGraph Entity & Subgraph Traversal
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-muted">
              Select any node or edge in the graph canvas to inspect relational evidence
            </span>
          </div>
        </div>

        {/* Graph Canvas + Inspector Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 items-stretch">
          <div className="h-[520px] rounded-xl overflow-hidden border border-white/[.08] bg-[#070a0f] relative shadow-inner">
            <InvestigationGraph
              data={graph}
              onNodeClick={setSelectedNode}
              selectedNode={selectedNode}
              flaggedTxnId={investigation.triggerTransactionId}
            />
          </div>

          <div className="h-[520px] flex flex-col">
            <NodeDetails
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
            />
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 4: INVESTIGATION TIMELINE PROGRESSION                        */}
      {/* ==================================================================== */}
      <InvestigationTimelineSection investigation={investigation} />

      {/* ==================================================================== */}
      {/* SECTION 5: UNCERTAINTY ASSESSMENT & EVIDENCE REQUEST DISPATCH        */}
      {/* ==================================================================== */}
      <UncertaintySection
        investigation={investigation}
        onRequestEvidence={() => setAddEvidenceOpen(true)}
      />

      {/* ==================================================================== */}
      {/* SECTION 6: NEXT BEST ACTION (BEFORE vs AFTER + WHAT CHANGED)         */}
      {/* ==================================================================== */}
      <NextBestActionSection investigation={investigation} />

      {/* ==================================================================== */}
      {/* SECTION 7: POLICY EXPLANATION (R1-R10 INSTITUTIONAL RULES)          */}
      {/* ==================================================================== */}
      <PolicyExplanationSection investigation={investigation} />

      {/* ==================================================================== */}
      {/* SECTION 8: PRIOR CASE MEMORY (PRECEDENT CASES FROM CLOSED HISTORY)   */}
      {/* ==================================================================== */}
      <PriorCaseMemorySection
        similarCases={investigation.similarCases}
        currentCaseId={investigation.caseId}
      />

      {/* ==================================================================== */}
      {/* SECTION 9: SUSPICIOUS ACTIVITY REPORT (FinCEN SAR / BSA COMPLIANCE)   */}
      {/* ==================================================================== */}
      <SarSection investigation={investigation} />

      {/* ==================================================================== */}
      {/* SECTION 10: TECHNICAL AGENT DETAILS & TIGERGRAPH PERSISTENCE TRACE   */}
      {/* ==================================================================== */}
      <AgentExecutionDetailsSection investigation={investigation} />

      {/* ==================================================================== */}
      {/* INTERACTIVE EVIDENCE INJECTION MODAL                                */}
      {/* ==================================================================== */}
      <AddEvidenceDialog
        open={addEvidenceOpen}
        onClose={() => setAddEvidenceOpen(false)}
        onSubmit={handleAddEvidence}
      />
    </div>
  );
}
