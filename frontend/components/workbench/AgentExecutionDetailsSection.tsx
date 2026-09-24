"use client";

import { useState } from "react";
import type { Investigation } from "@/lib/types";
import {
  Cpu,
  Database,
  Terminal,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Copy,
  Check,
  Network,
  Zap,
  ShieldAlert,
} from "lucide-react";

export interface AgentExecutionDetailsSectionProps {
  investigation: Investigation;
}

export function AgentExecutionDetailsSection({
  investigation,
}: AgentExecutionDetailsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copied, setCopied] = useState(false);

  const rawJson = JSON.stringify(investigation, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="rounded-xl border border-white/[.08] bg-[#0c1017]/90 p-5 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange/10 border border-orange/20 flex items-center justify-center text-orange">
            <Cpu size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-wider text-muted uppercase font-semibold">
                SECTION 10 · SYSTEM AUDIT & AGENT TRACE
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Agent Evaluated</span>
              </span>
            </div>
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Technical Agent Details & TigerGraph Persistence Trace
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[.04] hover:bg-white/[.08] text-white font-mono text-xs transition-colors"
          >
            <span>{isOpen ? "Hide Technical Details" : "View Technical Execution Trace"}</span>
            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="mt-4 space-y-4 text-xs font-mono">
          {/* Subsystem Telemetry Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Orchestration Framework */}
            <div className="p-3.5 rounded-lg border border-white/[.06] bg-[#070a0f]">
              <div className="flex items-center gap-1.5 text-muted text-[11px] mb-1">
                <Zap size={13} className="text-orange" />
                <span>AGENT FRAMEWORK</span>
              </div>
              <div className="text-white font-bold">LangGraph v0.2.x</div>
              <div className="text-[10px] text-dim mt-0.5">StateGraph Multi-Step Loop</div>
            </div>

            {/* Graph Engine */}
            <div className="p-3.5 rounded-lg border border-white/[.06] bg-[#070a0f]">
              <div className="flex items-center gap-1.5 text-muted text-[11px] mb-1">
                <Database size={13} className="text-cyan-400" />
                <span>GRAPH ENGINE</span>
              </div>
              <div className="text-white font-bold">TigerGraph Savanna</div>
              <div className="text-[10px] text-dim mt-0.5">pyTigerGraph REST / GSQL Subgraphs</div>
            </div>

            {/* TigerGraph Write Status */}
            <div className="p-3.5 rounded-lg border border-white/[.06] bg-[#070a0f]">
              <div className="flex items-center gap-1.5 text-muted text-[11px] mb-1">
                <Network size={13} className="text-indigo-400" />
                <span>GRAPH PERSISTENCE</span>
              </div>
              <div className="flex items-center gap-1.5 text-white font-bold">
                {investigation.writtenToGraph ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    <span>Verified Write</span>
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <span>Query Subgraph Only</span>
                  </span>
                )}
              </div>
              <div className="text-[10px] text-dim mt-0.5">
                Vertex: <span className="text-[#dfe4e8]">{investigation.graphCaseId || investigation.caseId}</span>
              </div>
            </div>

            {/* Stop Reason */}
            <div className="p-3.5 rounded-lg border border-white/[.06] bg-[#070a0f]">
              <div className="flex items-center gap-1.5 text-muted text-[11px] mb-1">
                <Terminal size={13} className="text-emerald-400" />
                <span>STOP CONDITION</span>
              </div>
              <div className="text-white font-bold truncate">
                {investigation.stopReason || "Policy terminal action reached"}
              </div>
              <div className="text-[10px] text-dim mt-0.5">
                Evaluated in {(investigation.evidence || []).length} evidence iterations
              </div>
            </div>
          </div>

          {/* Execution Pipeline Overview */}
          <div className="p-4 rounded-lg bg-black/40 border border-white/[.06]">
            <div className="text-muted text-[11px] font-semibold uppercase tracking-wider mb-2">
              LangGraph State Transition Pipeline
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-[11px]">
              <div className="p-2.5 rounded bg-white/[.02] border border-white/[.05]">
                <div className="text-muted text-[10px]">STEP 1</div>
                <div className="text-white font-semibold">Ingestion & ML Risk</div>
                <div className="text-dim text-[10px]">Flagged Txn {investigation.triggerTransactionId}</div>
              </div>
              <div className="p-2.5 rounded bg-white/[.02] border border-white/[.05]">
                <div className="text-muted text-[10px]">STEP 2</div>
                <div className="text-white font-semibold">TigerGraph Subgraph</div>
                <div className="text-dim text-[10px]">1-Hop & 2-Hop BFS expansion</div>
              </div>
              <div className="p-2.5 rounded bg-white/[.02] border border-white/[.05]">
                <div className="text-muted text-[10px]">STEP 3</div>
                <div className="text-white font-semibold">Device & Velocity</div>
                <div className="text-dim text-[10px]">Profile fingerprint lookup</div>
              </div>
              <div className="p-2.5 rounded bg-white/[.02] border border-white/[.05]">
                <div className="text-muted text-[10px]">STEP 4</div>
                <div className="text-white font-semibold">Precedent Memory</div>
                <div className="text-dim text-[10px]">closed_cases_history cross-ref</div>
              </div>
              <div className="p-2.5 rounded bg-white/[.02] border border-white/[.05]">
                <div className="text-white font-semibold text-orange">Policy Rule {investigation.policyDetail?.rule || "R9"}</div>
                <div className="text-dim text-[10px]">Bayesian calibration + actions</div>
              </div>
            </div>
          </div>

          {/* Raw JSON State Inspector Toggle */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline underline-offset-4 flex items-center gap-1.5"
              >
                <span>{showRawJson ? "Hide Full LangGraph State JSON" : "Inspect Full LangGraph State JSON"}</span>
                {showRawJson ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {showRawJson && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] text-muted hover:text-white px-2 py-0.5 rounded border border-white/10"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copied ? "Copied" : "Copy JSON"}</span>
                </button>
              )}
            </div>

            {showRawJson && (
              <pre className="max-h-96 overflow-auto p-4 rounded-lg bg-[#05070a] border border-white/[.08] text-[11px] text-[#9bb0c1] font-mono leading-relaxed">
                {rawJson}
              </pre>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
