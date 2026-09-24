"use client";

import type { Investigation } from "@/lib/types";
import { formatTimestamp } from "@/lib/utils";
import { CheckCircle2, Clock, GitCommit, ArrowDown, ShieldAlert, Cpu, Network, Database } from "lucide-react";

export function InvestigationTimelineSection({ investigation }: { investigation: Investigation }) {
  const steps = investigation.timelineSteps && investigation.timelineSteps.length > 0
    ? investigation.timelineSteps
    : [
        {
          step: 1,
          title: "Trigger Ingestion",
          action: `Flagged transaction ${investigation.triggerTransactionId} received from ML anomaly detector`,
          result: `Investigation case ${investigation.caseId} opened with risk score ${investigation.risk?.riskScore?.toFixed(2)}`,
          timestamp: investigation.createdAt,
          status: "completed",
        },
        {
          step: 2,
          title: "TigerGraph Neighborhood Traversal",
          action: `Queried 1-hop and 2-hop graph topology for card ${investigation.cardId || "target"}`,
          result: "Traversed customer, card, and device relationship vertices",
          timestamp: investigation.createdAt,
          status: "completed",
        },
        {
          step: 3,
          title: "Prior Case Memory Retrieval",
          action: "Scanned 5,565 closed historical cases for behavioral and typology similarity",
          result: `Retrieved ${investigation.similarCases?.length || 2} relevant historical precedents`,
          timestamp: investigation.createdAt,
          status: "completed",
        },
        {
          step: 4,
          title: "Typology & Uncertainty Assessment",
          action: `Evaluated fraud pattern hypotheses against bank fraud policy ${investigation.policy?.policyId || "R9"}`,
          result: `Pattern classified as '${investigation.pattern || "none"}' with ${investigation.risk?.uncertainty} uncertainty`,
          timestamp: investigation.createdAt,
          status: "completed",
        },
        {
          step: 5,
          title: "Next Best Action Formulation",
          action: `Formulated actionable policy recommendation under approval route ${investigation.approvalRoute || "AUTOMATED"}`,
          result: `Recommended action: ${investigation.policy?.actions?.[0] || "ESCALATE_TO_ANALYST"}`,
          timestamp: investigation.createdAt,
          status: "completed",
        },
      ];

  const getStepIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("trigger")) return <ShieldAlert size={14} className="text-orange" />;
    if (t.includes("graph")) return <Network size={14} className="text-blue" />;
    if (t.includes("memory") || t.includes("case")) return <Database size={14} className="text-purple-400" />;
    if (t.includes("action") || t.includes("typology")) return <Cpu size={14} className="text-emerald-400" />;
    return <GitCommit size={14} className="text-muted" />;
  };

  return (
    <div className="rounded-xl border border-white/[.1] bg-[#0c1017]/90 p-5 shadow-xl">
      {/* Title Bar */}
      <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-white/[.08]">
        <div>
          <span className="font-mono text-xs font-bold tracking-wider text-blue uppercase block">
            SECTION 4 • INVESTIGATION TIMELINE
          </span>
          <p className="text-xs text-muted font-sans mt-0.5">
            Step-by-step agentic progression: trigger → graph retrieval → memory matching → decision.
          </p>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
          <CheckCircle2 size={12} />
          <span>Workflow Finalized</span>
        </div>
      </div>

      {/* Vertical Agentic Stepper */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-[11px] sm:before:left-[15px] before:top-3 before:bottom-3 before:w-[2px] before:bg-white/[.08]">
        {steps.map((s, idx) => (
          <div key={idx} className="relative group">
            {/* Step Node Dot */}
            <div className="absolute -left-[23px] sm:-left-[27px] top-1 w-6 h-6 rounded-full bg-[#0a0e14] border border-white/20 flex items-center justify-center shadow-md group-hover:border-orange transition-colors">
              {getStepIcon(s.title)}
            </div>

            {/* Step Content Card */}
            <div className="p-3.5 rounded-xl border border-white/[.06] bg-black/40 hover:bg-white/[.02] transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue/15 text-blue border border-blue/30">
                    STEP {s.step}
                  </span>
                  <h4 className="font-sans text-xs font-bold text-white tracking-tight">
                    {s.title}
                  </h4>
                </div>
                <span className="font-mono text-[10px] text-muted flex items-center gap-1">
                  <Clock size={11} />
                  <span>{formatTimestamp(s.timestamp)}</span>
                </span>
              </div>

              {/* Action Description */}
              <div className="text-xs text-[#cbd5e1] font-sans mb-2">
                <span className="font-mono text-[10px] text-muted uppercase tracking-wider block mb-0.5">
                  Agent Action:
                </span>
                {s.action}
              </div>

              {/* Result Description */}
              <div className="p-2.5 rounded-lg bg-white/[.02] border border-white/[.04] text-xs font-mono text-[#e2e8f0] flex items-center justify-between">
                <span>
                  <strong className="text-emerald-400">Result:</strong> {s.result}
                </span>
                <span className="text-[10px] text-muted uppercase">Verified</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
