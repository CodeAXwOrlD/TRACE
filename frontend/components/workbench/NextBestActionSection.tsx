"use client";

import type { Investigation } from "@/lib/types";
import { ArrowRight, CheckCircle2, ShieldCheck, AlertCircle, RefreshCw, Zap } from "lucide-react";

export function NextBestActionSection({ investigation }: { investigation: Investigation }) {
  const initRec = investigation.initialRecommendation || {
    action: investigation.risk?.verdict === "UNCERTAIN" ? "VERIFY_WITH_CUSTOMER" : (investigation.policy?.actions?.[0] || "MONITOR"),
    route: "AUTOMATED",
    policy: investigation.policy?.policyId || "R1",
    reason: `Initial risk score (${investigation.risk?.riskScore?.toFixed(2)}) flagged for preliminary automated triage under policy ${investigation.policy?.policyId || "R1"}.`,
    status: "completed",
  };

  const updatedRec = investigation.updatedRecommendation || {
    action: investigation.policy?.actions?.[0] || "ESCALATE_TO_ANALYST",
    route: investigation.approvalRoute || "AUTOMATED",
    policy: investigation.policy?.policyId || "R9",
    reason: investigation.rationale,
    status: "recommended",
  };

  const whatChanged =
    investigation.whatChanged ||
    `Multi-hop graph traversal and similarity matching against ${investigation.similarCases?.length || 2} historical cases established pattern '${investigation.pattern || "none"}', updating the operational recommendation to ${updatedRec.action} via route ${updatedRec.route}.`;

  const formatActionName = (act: string) => {
    return act.replace(/_/g, " ").toUpperCase();
  };

  return (
    <div className="rounded-xl border border-white/[.1] bg-[#0c1017]/90 p-5 shadow-xl">
      {/* Title Bar */}
      <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-white/[.08]">
        <div>
          <span className="font-mono text-xs font-bold tracking-wider text-emerald-400 uppercase block">
            SECTION 6 • NEXT BEST ACTION & RECOMMENDATION EVOLUTION
          </span>
          <p className="text-xs text-muted font-sans mt-0.5">
            Operational action recommendations before vs after multi-source evidence acquisition.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted">
            Approval Route: <strong className="text-white">{updatedRec.route}</strong>
          </span>
        </div>
      </div>

      {/* Two Comparison Recommendation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* 1. Initial Recommendation (Before Evidence) */}
        <div className="p-4 rounded-xl border border-white/[.08] bg-black/40 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/[.06]">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold">
                1. INITIAL RECOMMENDATION (BEFORE EVIDENCE)
              </span>
              <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-white/[.06] text-muted border border-white/10 uppercase">
                Executed
              </span>
            </div>

            <div className="text-lg font-black font-mono text-white mb-2 tracking-tight">
              {formatActionName(initRec.action)}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
              <div className="p-2 rounded bg-white/[.02] border border-white/[.04]">
                <span className="text-muted text-[10px] uppercase block">Route</span>
                <span className="text-emerald-400 font-semibold">{initRec.route}</span>
              </div>
              <div className="p-2 rounded bg-white/[.02] border border-white/[.04]">
                <span className="text-muted text-[10px] uppercase block">Policy Rule</span>
                <span className="text-white font-semibold">{initRec.policy}</span>
              </div>
            </div>

            <p className="text-xs text-[#cbd5e1] font-sans leading-relaxed">
              {initRec.reason}
            </p>
          </div>

          <div className="pt-3 mt-3 border-t border-white/[.04] text-[10px] font-mono text-dim">
            Status: Initial automated action executed at trigger ingestion
          </div>
        </div>

        {/* 2. Updated Recommendation (After Evidence) */}
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-[#081710]/80 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-500/20">
              <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                <Zap size={12} className="text-emerald-400" />
                2. UPDATED RECOMMENDATION (AFTER EVIDENCE)
              </span>
              <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase font-bold">
                Active Policy Action
              </span>
            </div>

            <div className="text-lg font-black font-mono text-emerald-400 mb-2 tracking-tight">
              {formatActionName(updatedRec.action)}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
              <div className="p-2 rounded bg-black/40 border border-emerald-500/20">
                <span className="text-muted text-[10px] uppercase block">Approval Route</span>
                <span className="text-white font-bold">{updatedRec.route}</span>
              </div>
              <div className="p-2 rounded bg-black/40 border border-emerald-500/20">
                <span className="text-muted text-[10px] uppercase block">Policy Standard</span>
                <span className="text-emerald-400 font-bold">{updatedRec.policy}</span>
              </div>
            </div>

            <p className="text-xs text-[#e2e8f0] font-sans leading-relaxed">
              {updatedRec.reason}
            </p>
          </div>

          <div className="pt-3 mt-3 border-t border-emerald-500/20 text-[10px] font-mono text-emerald-400 font-medium">
            Execution Route: Enforced under compliance approval authority {updatedRec.route}
          </div>
        </div>
      </div>

      {/* "WHAT CHANGED" Callout Banner */}
      <div className="p-4 rounded-xl bg-orange/10 border border-orange/30 shadow-md">
        <div className="flex items-center gap-2 mb-1.5">
          <RefreshCw size={14} className="text-orange animate-spin-slow" />
          <span className="font-mono text-xs font-bold text-orange tracking-wider uppercase">
            WHAT CHANGED & WHY RECOMMENDATION SHIFTED
          </span>
        </div>
        <p className="text-xs text-[#fed7aa] font-sans leading-relaxed">
          {whatChanged}
        </p>
      </div>
    </div>
  );
}
