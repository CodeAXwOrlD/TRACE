"use client";

import type { Investigation } from "@/lib/types";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { HelpCircle, AlertCircle, ShieldCheck, DollarSign, StopCircle, CheckCircle } from "lucide-react";

export function InvestigationSummary({ investigation }: { investigation: Investigation }) {
  const riskScore = investigation.risk?.riskScore ?? investigation.riskScore ?? 0.0;
  const fraudProbability = investigation.risk?.probability ?? investigation.fraudProbability;
  const hasProb = fraudProbability !== null && fraudProbability !== undefined && !isNaN(fraudProbability);
  const exposure = investigation.exposureUsd ?? 0.0;

  const patternDisplay =
    investigation.pattern && investigation.pattern !== "none"
      ? investigation.pattern.replace(/_/g, " ").toUpperCase()
      : "NO KNOWN FRAUD PATTERN (CLEAN)";

  const stopReason =
    investigation.stopReason ||
    `Defensible evidence threshold satisfied per policy ${investigation.policy?.policyId || "R9"} — investigation finalized.`;

  return (
    <div className="rounded-xl border border-white/[.1] bg-[#0c1017]/90 p-5 shadow-xl">
      {/* Title Bar */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/[.08]">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold tracking-wider text-blue uppercase">
            SECTION 1 • INVESTIGATION SUMMARY
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted">Core Agent Findings</span>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {/* 1. Verdict */}
        <div className="p-3 rounded-lg bg-black/40 border border-white/[.06]">
          <span className="font-mono text-[10px] text-muted uppercase block mb-1">Verdict</span>
          <RiskBadge verdict={investigation.risk.verdict} />
        </div>

        {/* 2. Fraud Pattern */}
        <div className="p-3 rounded-lg bg-black/40 border border-white/[.06]">
          <span className="font-mono text-[10px] text-muted uppercase block mb-1">Fraud Pattern</span>
          <span className="font-mono text-xs font-bold text-white block truncate" title={patternDisplay}>
            {patternDisplay}
          </span>
        </div>

        {/* 3. Fraud Probability */}
        <div className="p-3 rounded-lg bg-black/40 border border-white/[.06]">
          <span className="font-mono text-[10px] text-muted uppercase block mb-1">Fraud Prob.</span>
          {hasProb ? (
            <span
              className={`font-mono text-base font-extrabold ${
                fraudProbability >= 0.7
                  ? "text-red"
                  : fraudProbability >= 0.3
                  ? "text-amber"
                  : "text-green"
              }`}
            >
              {Math.round(fraudProbability * 100)}%
            </span>
          ) : (
            <span className="font-mono text-xs text-muted">Pending</span>
          )}
        </div>

        {/* 4. Risk Score (Input) */}
        <div className="p-3 rounded-lg bg-black/40 border border-white/[.06]">
          <span className="font-mono text-[10px] text-muted uppercase block mb-1">Risk Score (Input)</span>
          <span className="font-mono text-base font-bold text-[#cbd5e1]">{riskScore.toFixed(2)}</span>
        </div>

        {/* 5. Exposure */}
        <div className="p-3 rounded-lg bg-black/40 border border-white/[.06]">
          <span className="font-mono text-[10px] text-muted uppercase block mb-1">Exposure</span>
          <span className="font-mono text-base font-bold text-white">
            ${exposure.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* 6. Status */}
        <div className="p-3 rounded-lg bg-black/40 border border-white/[.06]">
          <span className="font-mono text-[10px] text-muted uppercase block mb-1">Status</span>
          <span className="font-mono text-xs font-semibold text-orange uppercase">
            {investigation.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Rationale & Stop Reason Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* What Happened & Agent Belief */}
        <div className="p-3.5 rounded-lg bg-white/[.02] border border-white/[.06]">
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[#dfe4e8] mb-1.5">
            <AlertCircle size={13} className="text-orange" />
            <span>EXECUTIVE RATIONALE & WHAT HAPPENED</span>
          </div>
          <p className="text-xs text-[#cbd5e1] leading-relaxed font-sans">
            {investigation.rationale}
          </p>
        </div>

        {/* Why the Agent Stopped Investigating */}
        <div className="p-3.5 rounded-lg bg-white/[.02] border border-white/[.06]">
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[#dfe4e8] mb-1.5">
            <StopCircle size={13} className="text-blue" />
            <span>INVESTIGATION TERMINATION CRITERIA</span>
          </div>
          <p className="text-xs text-[#cbd5e1] leading-relaxed font-sans mb-2">
            {stopReason}
          </p>
          <div className="flex items-center gap-2 pt-2 border-t border-white/[.04] text-[11px] font-mono text-muted">
            <span>Approval Route:</span>
            <span className="text-emerald-400 font-semibold">{investigation.approvalRoute || "AUTOMATED"}</span>
            <span className="text-dim">•</span>
            <span>Policy Standard:</span>
            <span className="text-white font-semibold">{investigation.policy?.policyId || "R9"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
