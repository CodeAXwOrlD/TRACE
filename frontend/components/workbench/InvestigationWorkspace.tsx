"use client";

import { useState } from "react";
import type { EvidenceContractItem, EvidenceItem, GraphNode, Investigation, InvestigationGraphData } from "@/lib/types";
import { InvestigationHeader } from "./InvestigationHeader";
import { RiskScore } from "./RiskScore";
import { EvidenceCard } from "./EvidenceCard";
import { EvidenceChain } from "./EvidenceChain";
import { AddEvidenceDialog } from "./AddEvidenceDialog";
import { AgentActivity } from "./AgentActivity";
import { NodeDetails } from "./NodeDetails";
import { Timeline } from "@/components/ui/Timeline";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { useInvestigationStream } from "@/hooks/useInvestigationStream";
import { addEvidence as apiAddEvidence } from "@/lib/api";
import dynamic from "next/dynamic";

// Sigma.js touches WebGL/canvas — load client-side only, and lazily, per the
// "dynamic imports for heavy components" performance rule.
const InvestigationGraph = dynamic(
  () => import("@/components/graph/InvestigationGraph").then((m) => m.InvestigationGraph),
  {
    ssr: false,
    loading: () => (
      <div className="h-full min-h-[420px] flex items-center justify-center text-muted font-mono text-xs">
        Loading graph…
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
 * The split intelligence workspace:
 * - LEFT: context (Trigger, Customer, Risk Score, Agent Activity)
 * - CENTER: interactive Sigma.js WebGL graph + node details
 * - RIGHT: Evidence-to-Decision Chain & Evidence Cards + Add Evidence interaction
 * - BOTTOM: Investigation Timeline (flagged vs origin vs episode)
 */
export function InvestigationWorkspace({
  investigation: initialInvestigation,
  graph,
  evidence: initialEvidence,
}: InvestigationWorkspaceProps) {
  const [investigation, setInvestigation] = useState<Investigation>(initialInvestigation);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>(initialEvidence);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [addEvidenceOpen, setAddEvidenceOpen] = useState(false);
  const [rightTab, setRightTab] = useState<"chain" | "cards">("chain");

  const { events, isRunning } = useInvestigationStream(investigation.triggerTransactionId);

  const handleAddEvidence = async (item: EvidenceContractItem) => {
    const res = await apiAddEvidence(investigation.caseId, item);
    if (res.success && res.investigation) {
      setInvestigation({ ...res.investigation });
      setEvidenceList([...res.investigation.evidence]);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <InvestigationHeader investigation={investigation} />

      <div className="grid grid-cols-1 lg:grid-cols-[270px_1fr_360px] gap-5">
        {/* LEFT: investigation context */}
        <div className="flex flex-col gap-5">
          <Panel title="TRIGGER TRANSACTION">
            <div className="font-mono text-sm text-[#dfe4e8] font-semibold">
              {investigation.triggerTransactionId}
            </div>
            {investigation.cardId && (
              <div className="font-mono text-xs text-muted mt-1">Card: {investigation.cardId}</div>
            )}
          </Panel>

          <Panel title="CUSTOMER">
            <div className="font-mono text-sm text-[#dfe4e8] font-semibold">{investigation.customerId}</div>
          </Panel>

          <Panel
            title="RISK & PROBABILITY"
            accent={
              investigation.risk.verdict === "FRAUD"
                ? "red"
                : investigation.risk.verdict === "LEGITIMATE"
                ? "green"
                : "amber"
            }
          >
            <RiskScore risk={investigation.risk} />
          </Panel>

          <Panel title="AGENT REALTIME STREAM">
            <AgentActivity events={events} caseId={investigation.caseId} isRunning={isRunning} />
          </Panel>
        </div>

        {/* CENTER: interactive graph */}
        <Panel className="min-h-[520px] flex flex-col">
          <div className="flex-1">
            <InvestigationGraph data={graph} onNodeClick={setSelectedNode} />
          </div>
          {selectedNode && (
            <div className="mt-4">
              <NodeDetails node={selectedNode} onClose={() => setSelectedNode(null)} />
            </div>
          )}
        </Panel>

        {/* RIGHT: evidence / reasoning panel & Decision Chain */}
        <Panel>
          <div className="flex items-center justify-between border-b border-white/[.08] pb-3 mb-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRightTab("chain")}
                className={`font-mono text-[11px] font-semibold px-2.5 py-1 rounded transition-colors ${
                  rightTab === "chain"
                    ? "bg-white text-[#0a0e13]"
                    : "text-muted hover:text-white"
                }`}
              >
                DECISION CHAIN
              </button>
              <button
                type="button"
                onClick={() => setRightTab("cards")}
                className={`font-mono text-[11px] font-semibold px-2.5 py-1 rounded transition-colors ${
                  rightTab === "cards"
                    ? "bg-white text-[#0a0e13]"
                    : "text-muted hover:text-white"
                }`}
              >
                EVIDENCE ({evidenceList.length})
              </button>
            </div>

            <button
              type="button"
              onClick={() => setAddEvidenceOpen(true)}
              className="font-mono text-[10px] font-semibold text-orange border border-orange/50 hover:bg-orange hover:text-white px-2 py-1 rounded transition-colors"
            >
              + Add Evidence
            </button>
          </div>

          {rightTab === "chain" ? (
            <EvidenceChain investigation={investigation} events={events} />
          ) : (
            <div className="space-y-3">
              {evidenceList.length === 0 ? (
                <EmptyState
                  title="No evidence items"
                  description="Inject evidence or wait for the agent stream."
                />
              ) : (
                evidenceList.map((e) => <EvidenceCard key={e.id} evidence={e} />)
              )}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-white/[.08]">
            <div className="font-mono text-[10px] tracking-wider text-muted mb-1.5 uppercase">
              RATIONALE (LLM EXPLANATION)
            </div>
            <p className="text-xs text-[#dfe4e8] leading-relaxed font-sans">{investigation.rationale}</p>
          </div>
        </Panel>
      </div>

      {/* BOTTOM: investigation timeline */}
      <Panel title="INVESTIGATION TIMELINE & CARD EPISODE">
        <Timeline
          transactions={investigation.timeline}
          flaggedId={investigation.triggerTransactionId}
          firstSuspiciousId={investigation.firstSuspiciousTxnId}
          episodeTxnIds={investigation.episodeTxnIds}
        />
      </Panel>

      <AddEvidenceDialog
        open={addEvidenceOpen}
        onClose={() => setAddEvidenceOpen(false)}
        onSubmit={handleAddEvidence}
      />
    </div>
  );
}
