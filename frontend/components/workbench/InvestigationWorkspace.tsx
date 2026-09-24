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
import { ShieldCheck, FileCheck, Layers, AlertTriangle, ArrowUpRight, Cpu, Network } from "lucide-react";
import dynamic from "next/dynamic";

// High-fidelity TigerGraph Savanna Canvas (pure SVG + Force-Atlas layout)
const InvestigationGraph = dynamic(
  () => import("@/components/graph/InvestigationGraph").then((m) => m.InvestigationGraph),
  {
    ssr: false,
    loading: () => (
      <div className="h-full min-h-[520px] flex flex-col items-center justify-center text-muted font-mono text-xs bg-[#070a0f] rounded-xl border border-white/10">
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
 * Enterprise Fraud Intelligence Command Center:
 * - HEADER: Live Status, TigerGraph Live Status, Quick Actions
 * - LEFT: Trigger Context, Customer Entity, Calibrated Risk Score, Live Agent Stream
 * - CENTER: TigerGraph GraphStudio Canvas + Selected Vertex Inspector
 * - RIGHT: Decision Chain, Defensible Evidence, FinCEN SAR Filing Generator
 * - BOTTOM: Card History & Episode Evolution Timeline
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
  const [rightTab, setRightTab] = useState<"chain" | "cards" | "sar">("chain");

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
      {/* 1. Command Header */}
      <InvestigationHeader investigation={investigation} />

      {/* 2. Three-Column Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_380px] gap-5 items-start">
        
        {/* ============================================================== */}
        {/* LEFT COLUMN: Context & Agentic Telemetry                       */}
        {/* ============================================================== */}
        <div className="flex flex-col gap-4">
          
          {/* Trigger Context Card */}
          <div className="rounded-xl border border-white/[.1] bg-[#0c1017]/90 p-4 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] tracking-wider text-muted uppercase font-semibold">
                TRIGGER TRANSACTION
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-orange/15 text-orange border border-orange/30 font-bold">
                FLAGGED
              </span>
            </div>
            <div className="font-mono text-lg text-white font-bold tracking-tight">
              {investigation.triggerTransactionId}
            </div>
            <div className="mt-2 pt-2 border-t border-white/[.06] flex items-center justify-between text-xs font-mono">
              <span className="text-muted">Card:</span>
              <span className="text-[#dfe4e8] font-medium">{investigation.cardId || "····4417"}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono mt-1">
              <span className="text-muted">Customer:</span>
              <span className="text-emerald-400 font-medium">{investigation.customerId}</span>
            </div>
          </div>

          {/* Calibrated Risk & Uncertainty */}
          <div className="rounded-xl border border-white/[.1] bg-[#0c1017]/90 p-4 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] tracking-wider text-muted uppercase font-semibold">
                RISK & UNCERTAINTY
              </span>
              <span className="text-[10px] font-mono text-dim">BAYESIAN CALIBRATED</span>
            </div>
            <RiskScore risk={investigation.risk} />
          </div>

          {/* Realtime Agent Stream */}
          <div className="rounded-xl border border-white/[.1] bg-[#0c1017]/90 p-4 shadow-lg flex flex-col">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/[.06]">
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold text-white">
                <Cpu size={13} className="text-orange" />
                <span>LANGGRAPH AGENT STREAM</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-medium">12 NODES</span>
            </div>
            <div className="max-h-[220px] overflow-y-auto pr-1">
              <AgentActivity events={events} caseId={investigation.caseId} isRunning={isRunning} />
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* CENTER COLUMN: TigerGraph Savanna Live Canvas                  */}
        {/* ============================================================== */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-white/[.12] bg-[#070a0f] overflow-hidden shadow-2xl flex flex-col">
            {/* Graph Canvas */}
            <div className="h-[560px] w-full relative">
              <InvestigationGraph data={graph} onNodeClick={setSelectedNode} />
            </div>

            {/* Selected Node Inspector Drawer */}
            {selectedNode && (
              <div className="border-t border-white/[.1] bg-[#0b0f17] p-4 animate-in fade-in duration-200">
                <NodeDetails node={selectedNode} onClose={() => setSelectedNode(null)} />
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: Decision Chain, Evidence, SAR Filing             */}
        {/* ============================================================== */}
        <div className="rounded-xl border border-white/[.1] bg-[#0c1017]/90 p-4 shadow-xl flex flex-col">
          {/* Tab Navigation */}
          <div className="flex items-center justify-between border-b border-white/[.08] pb-3 mb-4">
            <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-white/5">
              <button
                type="button"
                onClick={() => setRightTab("chain")}
                className={`font-mono text-[10px] font-semibold px-2.5 py-1 rounded transition-all ${
                  rightTab === "chain"
                    ? "bg-white text-black shadow-sm font-bold"
                    : "text-muted hover:text-white"
                }`}
              >
                DECISION CHAIN
              </button>
              <button
                type="button"
                onClick={() => setRightTab("cards")}
                className={`font-mono text-[10px] font-semibold px-2.5 py-1 rounded transition-all ${
                  rightTab === "cards"
                    ? "bg-white text-black shadow-sm font-bold"
                    : "text-muted hover:text-white"
                }`}
              >
                EVIDENCE ({evidenceList.length})
              </button>
              <button
                type="button"
                onClick={() => setRightTab("sar")}
                className={`font-mono text-[10px] font-semibold px-2.5 py-1 rounded transition-all ${
                  rightTab === "sar"
                    ? "bg-white text-black shadow-sm font-bold"
                    : "text-muted hover:text-white"
                }`}
              >
                SAR REPORT
              </button>
            </div>

            <button
              type="button"
              onClick={() => setAddEvidenceOpen(true)}
              className="font-mono text-[10px] font-semibold text-orange hover:text-white bg-orange/10 hover:bg-orange border border-orange/40 px-2.5 py-1 rounded transition-all"
            >
              + Evidence
            </button>
          </div>

          {/* TAB 1: Decision Chain */}
          {rightTab === "chain" && (
            <EvidenceChain investigation={investigation} events={events} />
          )}

          {/* TAB 2: Evidence Cards */}
          {rightTab === "cards" && (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
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

          {/* TAB 3: FinCEN Form 111 SAR Filing Preview */}
          {rightTab === "sar" && (
            <div className="space-y-3 font-mono text-xs max-h-[500px] overflow-y-auto pr-1">
              <div className="p-3 rounded bg-red/10 border border-red/30">
                <div className="flex items-center gap-2 text-red font-bold text-[11px] mb-1">
                  <AlertTriangle size={14} />
                  <span>FinCEN SUSPICIOUS ACTIVITY REPORT</span>
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  Automatic regulatory filing threshold reached: Financial exposure exceeds $2,000 across syndicate cluster.
                </p>
              </div>

              <div className="space-y-2 bg-[#080c12] p-3 rounded border border-white/5 text-[11px]">
                <div className="flex justify-between py-1 border-b border-white/[.04]">
                  <span className="text-dim">Filing Authority:</span>
                  <span className="text-white font-semibold">BSA / FinCEN E-Filing</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[.04]">
                  <span className="text-dim">Primary Subject:</span>
                  <span className="text-white">{investigation.customerId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[.04]">
                  <span className="text-dim">Target Payment Card:</span>
                  <span className="text-orange">{investigation.cardId || "····4417"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[.04]">
                  <span className="text-dim">Syndicate Cards:</span>
                  <span className="text-white">{investigation.connectedCardIds?.join(", ") || "None"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[.04]">
                  <span className="text-dim">Typology Pattern:</span>
                  <span className="text-red font-semibold">{investigation.pattern}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[.04]">
                  <span className="text-dim">Policy Standard:</span>
                  <span className="text-white font-semibold">Rule R6 (Syndicate Fraud)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-dim">TigerGraph Status:</span>
                  <span className="text-emerald-400 font-semibold">WRITTEN TO GRAPH</span>
                </div>
              </div>

              <div className="p-3 rounded bg-white/[.02] border border-white/5">
                <span className="text-[10px] text-dim uppercase tracking-wider block mb-1">
                  Generated Audit Narrative
                </span>
                <p className="text-[11px] text-[#dfe4e8] leading-relaxed">
                  {investigation.rationale}
                </p>
              </div>
            </div>
          )}

          {/* Rationale Bottom Section */}
          <div className="mt-5 pt-3 border-t border-white/[.08]">
            <div className="font-mono text-[10px] tracking-wider text-muted mb-1 uppercase flex items-center justify-between">
              <span>AUDIT RATIONALE</span>
              <span className="text-emerald-400 font-semibold">AI EXPLAINABILITY</span>
            </div>
            <p className="text-xs text-[#dfe4e8] leading-relaxed font-sans">{investigation.rationale}</p>
          </div>
        </div>
      </div>

      {/* 3. Bottom Timeline: Card History & Episode Evolution */}
      <Panel title="INVESTIGATION TIMELINE & EPISODE BURST">
        <Timeline
          transactions={investigation.timeline}
          flaggedId={investigation.triggerTransactionId}
          firstSuspiciousId={investigation.firstSuspiciousTxnId}
          episodeTxnIds={investigation.episodeTxnIds}
        />
      </Panel>

      {/* Evidence Injection Modal */}
      <AddEvidenceDialog
        open={addEvidenceOpen}
        onClose={() => setAddEvidenceOpen(false)}
        onSubmit={handleAddEvidence}
      />
    </div>
  );
}
