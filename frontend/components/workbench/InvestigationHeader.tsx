"use client";

import type { Investigation } from "@/lib/types";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { formatTimestamp } from "@/lib/utils";
import { ArrowLeft, Copy, Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useGraphStatus } from "@/hooks/useGraphStatus";

export interface InvestigationHeaderProps {
  investigation: Investigation;
  onAddEvidenceClick?: () => void;
}

export function InvestigationHeader({ investigation, onAddEvidenceClick }: InvestigationHeaderProps) {
  const [copied, setCopied] = useState(false);
  const graphStatus = useGraphStatus();

  const copyCaseId = () => {
    navigator.clipboard?.writeText(investigation.caseId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const riskScore = investigation.risk?.riskScore ?? investigation.riskScore ?? 0.0;
  const fraudProbability = investigation.risk?.probability ?? investigation.fraudProbability;
  const hasProb = fraudProbability !== null && fraudProbability !== undefined && !isNaN(fraudProbability);
  const exposure = investigation.exposureUsd ?? 0.0;

  const statusLabel =
    investigation.status === "closed_fraud"
      ? "Closed (Fraud)"
      : investigation.status === "closed_legitimate"
      ? "Closed (Legitimate)"
      : investigation.status === "escalated"
      ? "Escalated"
      : "Open";

  const statusBadgeStyle =
    investigation.status === "closed_fraud"
      ? "text-red border-red/30 bg-red/10"
      : investigation.status === "closed_legitimate"
      ? "text-green border-green/30 bg-green/10"
      : investigation.status === "escalated"
      ? "text-amber border-amber/30 bg-amber/10"
      : "text-blue border-blue/30 bg-blue/10";

  return (
    <div className="flex flex-col gap-3 pb-5 border-b border-white/[.1]">
      {/* Top Navigation Breadcrumb & Graph Status */}
      <div className="flex items-center justify-between">
        <Link
          href="/investigations"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-muted hover:text-white transition-colors"
        >
          <ArrowLeft size={13} />
          <span>Back to Investigation Queue</span>
        </Link>

        {/* Unified Graph Connection Status Badge (Identical to navbar) */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
              graphStatus.tone === "green"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : graphStatus.tone === "amber"
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                : "bg-red-500/10 text-red-400 border-red-500/30"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                graphStatus.tone === "green"
                  ? "bg-emerald-400 animate-pulse"
                  : graphStatus.tone === "amber"
                  ? "bg-amber-400"
                  : "bg-red-400"
              }`}
            />
            {graphStatus.label}
          </span>
        </div>
      </div>

      {/* Main Header Content */}
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[11px] font-bold tracking-widest text-blue uppercase">
              AGENTIC FRAUD INVESTIGATION WORKSPACE
            </span>
            <span className="text-dim">•</span>
            <span className="font-mono text-[11px] text-muted uppercase">
              {investigation.pattern ? investigation.pattern.replace(/_/g, " ") : "Pending Review"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
              CASE {investigation.caseId}
            </h1>
            <button
              onClick={copyCaseId}
              title="Copy Case ID"
              className="p-1.5 rounded bg-white/[.04] hover:bg-white/[.08] text-dim hover:text-white border border-white/10 transition-colors"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
            <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${statusBadgeStyle}`}>
              {statusLabel}
            </span>
            <RiskBadge verdict={investigation.risk.verdict} />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted mt-2 font-mono">
            <span>
              Customer: <strong className="text-emerald-400">{investigation.customerId}</strong>
            </span>
            <span className="text-dim">|</span>
            <span>
              Card: <strong className="text-[#dfe4e8]">{investigation.cardId || "Not available"}</strong>
            </span>
            <span className="text-dim">|</span>
            <span>
              Trigger: <strong className="text-orange">{investigation.triggerTransactionId}</strong>
            </span>
            <span className="text-dim">|</span>
            <span>
              Opened: <strong className="text-dim" suppressHydrationWarning>{formatTimestamp(investigation.createdAt)}</strong>
            </span>
          </div>
        </div>

        {/* Right Side Metrics: Distinct Risk Score vs Fraud Probability vs Exposure */}
        <div className="flex items-center gap-4 bg-[#0a0e14] p-3 rounded-xl border border-white/[.08] shadow-lg">
          {/* 1. Risk Score (Input) */}
          <div className="flex flex-col text-right pr-4 border-r border-white/[.08]">
            <span className="font-mono text-[10px] tracking-wider text-muted uppercase">
              Risk Score (Input)
            </span>
            <span className="text-xl font-bold font-mono text-[#cbd5e1]">
              {riskScore.toFixed(2)}
            </span>
            <span className="text-[9px] font-mono text-dim">Model feature</span>
          </div>

          {/* 2. Fraud Probability (Calibrated) */}
          <div className="flex flex-col text-right pr-4 border-r border-white/[.08]">
            <span className="font-mono text-[10px] tracking-wider text-muted uppercase">
              Fraud Probability
            </span>
            {hasProb ? (
              <span
                className={`text-xl font-extrabold font-mono ${
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
              <span className="text-base font-bold font-mono text-muted">Pending</span>
            )}
            <span className="text-[9px] font-mono text-dim">Agent calibrated</span>
          </div>

          {/* 3. Exposure (USD) */}
          <div className="flex flex-col text-right">
            <span className="font-mono text-[10px] tracking-wider text-muted uppercase">
              Financial Exposure
            </span>
            <span className="text-xl font-bold font-mono text-white">
              ${exposure.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] font-mono text-dim">USD at risk</span>
          </div>
        </div>
      </div>
    </div>
  );
}
