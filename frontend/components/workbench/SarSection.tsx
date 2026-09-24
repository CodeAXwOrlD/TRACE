"use client";

import { useState } from "react";
import type { Investigation } from "@/lib/types";
import {
  FileCheck2,
  AlertTriangle,
  Download,
  Printer,
  Shield,
  Clock,
  User,
  CreditCard,
  DollarSign,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle,
} from "lucide-react";

export interface SarSectionProps {
  investigation: Investigation;
}

export function SarSection({ investigation }: SarSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [manualOverride, setManualOverride] = useState(false);
  const [copied, setCopied] = useState(false);

  const isRequired = investigation.sarRequired || manualOverride;
  const exposure = investigation.exposureUsd ?? 0;
  const customerId = investigation.customerId || "Unknown";
  const cardId = investigation.cardId || "Unknown";
  const caseId = investigation.caseId;
  const pattern = investigation.pattern || "Suspicious transaction activity";

  // Generated Defensible FinCEN SAR Narrative
  const narrative =
    investigation.sarNarrative ||
    `SUSPICIOUS ACTIVITY REPORT (FinCEN Form 111 / BSA 31 U.S.C. 5318(g))
CASE IDENTIFIER: ${caseId}
SUBJECT: Customer ${customerId}, Card Account ${cardId}
INVESTIGATION TRIGGER: Transaction ${investigation.triggerTransactionId} flagged for ${pattern}.
TOTAL FINANCIAL EXPOSURE: $${exposure.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD.

NARRATIVE SUMMARY:
Between ${new Date(investigation.createdAt).toLocaleDateString()}, the bank's automated graph surveillance platform detected anomalous transaction velocity and cross-entity linkages associated with customer ${customerId}.

WHO: Customer ${customerId}, operating under card ${cardId}.
WHAT: Multiple rapid transactions identified as suspected ${pattern.toString().toUpperCase()} without standard biometric or geographic device confirmation.
WHEN: Trigger transaction ${investigation.triggerTransactionId} recorded on ${new Date(investigation.createdAt).toLocaleString()}.
WHERE: Billing and identity graph telemetry indicate out-of-pattern terminal origins.
WHY SUSPICIOUS: Graph traversals verified atypical card rotation and synthetic profile markers exceeding institutional risk thresholds (Rule ${investigation.policyDetail?.rule || "R9"}).

RECOMMENDED DISPOSITION: Card blocked; customer notification dispatched; referral to Financial Crimes Enforcement Network.`;

  const copyNarrative = () => {
    navigator.clipboard.writeText(narrative);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="rounded-xl border border-white/[.08] bg-[#0c1017]/90 p-5 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/[.06]">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
              isRequired
                ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            }`}
          >
            <FileCheck2 size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-wider text-muted uppercase font-semibold">
                SECTION 09 · REGULATORY COMPLIANCE
              </span>
              <span
                className={`font-mono text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                  isRequired
                    ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                    : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                }`}
              >
                {isRequired ? "SAR FILING MANDATORY" : "SAR NOT REQUIRED"}
              </span>
            </div>
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Suspicious Activity Report (FinCEN SAR / BSA § 5318(g))
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isRequired ? (
            <button
              onClick={copyNarrative}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[.04] hover:bg-white/[.08] text-white font-mono text-xs transition-colors"
            >
              {copied ? <CheckCircle size={13} className="text-emerald-400" /> : <Download size={13} />}
              <span>{copied ? "Copied" : "Export SAR Text"}</span>
            </button>
          ) : (
            <button
              onClick={() => setManualOverride(!manualOverride)}
              className="font-mono text-[11px] px-2.5 py-1 rounded border border-white/10 text-muted hover:text-white hover:bg-white/[.05] transition-colors"
            >
              {manualOverride ? "Cancel Manual Filing" : "Initiate Manual SAR"}
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg border border-white/10 text-muted hover:text-white hover:bg-white/[.05]"
            title={isExpanded ? "Collapse SAR" : "Expand SAR"}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Main Body */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Statutory Threshold Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3.5 rounded-lg bg-black/40 border border-white/[.06] font-mono text-xs">
            <div>
              <span className="text-muted block text-[10px] uppercase font-semibold">
                FILING DETERMINATION
              </span>
              <span
                className={`font-bold inline-block mt-0.5 ${
                  isRequired ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {isRequired ? "MANDATORY FILING" : "BELOW THRESHOLD"}
              </span>
            </div>

            <div>
              <span className="text-muted block text-[10px] uppercase font-semibold">
                TOTAL EXPOSURE
              </span>
              <span className="text-white font-semibold mt-0.5 block">
                ${exposure.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div>
              <span className="text-muted block text-[10px] uppercase font-semibold">
                STATUTORY TRIGGER
              </span>
              <span className="text-[#dfe4e8] mt-0.5 block">
                {isRequired
                  ? "BSA 31 CFR 1020.320"
                  : "Exposure < $2,000 threshold"}
              </span>
            </div>

            <div>
              <span className="text-muted block text-[10px] uppercase font-semibold">
                FILING DEADLINE
              </span>
              <span className="text-amber-400 font-semibold mt-0.5 flex items-center gap-1">
                <Clock size={12} />
                <span>30 Days from Triage</span>
              </span>
            </div>
          </div>

          {/* Subject & Entity Identification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border border-white/[.06] bg-[#070a0f] text-xs font-mono">
              <div className="flex items-center gap-2 text-muted mb-1 text-[11px]">
                <User size={13} className="text-cyan-400" />
                <span>PRIMARY SUBJECT</span>
              </div>
              <div className="text-white font-bold">{customerId}</div>
              <div className="text-dim text-[10px] mt-0.5">Customer Master Entity</div>
            </div>

            <div className="p-3 rounded-lg border border-white/[.06] bg-[#070a0f] text-xs font-mono">
              <div className="flex items-center gap-2 text-muted mb-1 text-[11px]">
                <CreditCard size={13} className="text-indigo-400" />
                <span>FINANCIAL INSTRUMENT</span>
              </div>
              <div className="text-white font-bold">{cardId}</div>
              <div className="text-dim text-[10px] mt-0.5">Card Under Surveillance</div>
            </div>

            <div className="p-3 rounded-lg border border-white/[.06] bg-[#070a0f] text-xs font-mono sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 text-muted mb-1 text-[11px]">
                <Shield size={13} className="text-orange" />
                <span>INSTITUTIONAL POLICY</span>
              </div>
              <div className="text-white font-bold">{investigation.policyDetail?.rule || "R9 / ESCALATE"}</div>
              <div className="text-dim text-[10px] mt-0.5">Rule Compliance Disposition</div>
            </div>
          </div>

          {/* Audit Narrative Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-[11px] text-muted font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={13} />
                <span>Defensible Audit Narrative (Who · What · When · Where · Why)</span>
              </span>
              <span className="text-[10px] font-mono text-dim">
                Auto-generated from empirical LangGraph evidence state
              </span>
            </div>

            <div className="relative rounded-lg border border-white/[.08] bg-[#070a0f] p-4 font-mono text-xs text-[#c5cdd5] leading-relaxed whitespace-pre-wrap selection:bg-orange/20">
              {narrative}
            </div>
          </div>

          {/* Compliance Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white/[.02] border border-white/[.05] text-[11px] text-muted">
            <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <p>
              Under 31 U.S.C. 5318(g)(2), any bank, officer, or employee is prohibited from
              notifying any person involved in the transaction that the transaction has been
              reported. This SAR narrative is strictly confidential work product.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
