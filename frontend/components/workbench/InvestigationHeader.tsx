import type { Investigation } from "@/lib/types";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { formatTimestamp } from "@/lib/utils";
import { ShieldAlert, Network, ArrowLeft, ExternalLink, Copy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function InvestigationHeader({ investigation }: { investigation: Investigation }) {
  const [copied, setCopied] = useState(false);

  const copyCaseId = () => {
    navigator.clipboard?.writeText(investigation.caseId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3 pb-5 border-b border-white/[.1]">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/investigations"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-muted hover:text-white transition-colors"
        >
          <ArrowLeft size={13} />
          <span>Back to Investigation Queue</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            TIGERGRAPH LIVE GRAPH ACTIVE
          </span>
        </div>
      </div>

      {/* Main Header Content */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[11px] font-bold tracking-widest text-blue uppercase">
              FRAUD TRIAGE CONSOLE
            </span>
            <span className="text-dim">•</span>
            <span className="font-mono text-[11px] text-muted">
              {investigation.pattern?.toUpperCase() ?? "GENERAL REVIEW"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
              {investigation.caseId}
            </h1>
            <button
              onClick={copyCaseId}
              title="Copy Case ID"
              className="p-1.5 rounded bg-white/[.04] hover:bg-white/[.08] text-dim hover:text-white border border-white/10 transition-colors"
            >
              <Copy size={13} />
            </button>
            {copied && (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                COPIED
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted mt-2 font-mono">
            <span>Customer: <strong className="text-[#dfe4e8]">{investigation.customerId}</strong></span>
            <span className="text-dim">|</span>
            <span>Card: <strong className="text-[#dfe4e8]">{investigation.cardId || "····4417"}</strong></span>
            <span className="text-dim">|</span>
            <span>Trigger: <strong className="text-orange">{investigation.triggerTransactionId}</strong></span>
            <span className="text-dim">|</span>
            <span>Opened: <strong className="text-dim" suppressHydrationWarning>{formatTimestamp(investigation.createdAt)}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <RiskBadge verdict={investigation.risk.verdict} />
        </div>
      </div>
    </div>
  );
}
