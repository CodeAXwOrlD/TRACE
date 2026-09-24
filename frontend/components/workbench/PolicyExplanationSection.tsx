"use client";

import { useState } from "react";
import type { Investigation } from "@/lib/types";
import { BookOpen, CheckCircle, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";

export function PolicyExplanationSection({ investigation }: { investigation: Investigation }) {
  const [showAllPolicies, setShowAllPolicies] = useState(false);

  const activePolicyId = investigation.policy?.policyId || "R9";
  const pd = investigation.policyDetail || {
    rule: activePolicyId,
    title: "Card-Not-Present / Undocumented Review",
    condition: "Online or out-of-region transaction requiring supervisor review.",
    action: investigation.policy?.actions?.[0] || "ESCALATE_TO_ANALYST",
    route: investigation.approvalRoute || "AUTOMATED",
  };

  const allPolicies = [
    {
      rule: "R1",
      title: "Weak Signal Verification",
      condition: "Single weak or isolated anomaly score without corroborating device or velocity signals.",
      action: "VERIFY_WITH_CUSTOMER",
      route: "AUTOMATED",
    },
    {
      rule: "R2",
      title: "Customer Denied Transaction",
      condition: "Customer explicit denial or card compromise confirmation.",
      action: "BLOCK_CARD + CREATE_CASE",
      route: "L1_ANALYST",
    },
    {
      rule: "R3",
      title: "Customer Confirmed Legitimate",
      condition: "Cardholder validated authorization and recognized billing merchant/region.",
      action: "CLOSE_LEGITIMATE",
      route: "AUTOMATED",
    },
    {
      rule: "R4",
      title: "Unresponsive Verification Window",
      condition: "Verification sent with no customer response within SLA timeout.",
      action: "MONITOR_CARD + DECLINE_PENDING",
      route: "AUTOMATED",
    },
    {
      rule: "R5",
      title: "Card Testing Velocity Burst",
      condition: "Rapid succession of micro-authorizations followed by target purchase.",
      action: "DECLINE_TRANSACTION + STEP_UP_AUTH",
      route: "AUTOMATED",
    },
    {
      rule: "R6",
      title: "Shared Origin Compromise",
      condition: "Multiple customer cards connected to single compromised device or proxy fingerprint.",
      action: "CREATE_CASE + MONITOR_CONNECTED_CARDS",
      route: "L1_ANALYST",
    },
    {
      rule: "R7",
      title: "Recurring Subscription Anomaly",
      condition: "Disputed recurring subscription pattern with prior legitimate history.",
      action: "WARN_CUSTOMER + CREATE_CASE",
      route: "AUTOMATED",
    },
    {
      rule: "R8",
      title: "Conflicting Evidence Escalation",
      condition: "Uncertain verdict with elevated exposure (> $100) or conflicting graph telemetry.",
      action: "ESCALATE_TO_ANALYST",
      route: "L2_SPECIALIST",
    },
    {
      rule: "R9",
      title: "Card-Not-Present / Undocumented Review",
      condition: "Online or out-of-region transaction requiring supervisor review.",
      action: "ESCALATE_TO_ANALYST",
      route: "AUTOMATED",
    },
    {
      rule: "R10",
      title: "Card Containment Guardrail",
      condition: "Prohibits global card freeze unless confirmed multi-card compromise exists.",
      action: "GUARDRAIL_APPLIED",
      route: "AUTOMATED",
    },
  ];

  return (
    <div className="rounded-xl border border-white/[.1] bg-[#0c1017]/90 p-5 shadow-xl">
      {/* Title Bar */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/[.08]">
        <div>
          <span className="font-mono text-xs font-bold tracking-wider text-purple-400 uppercase block">
            SECTION 7 • FRAUD POLICY BASIS & APPROVAL ROUTE
          </span>
          <p className="text-xs text-muted font-sans mt-0.5">
            Deterministic institutional policy rule invoked to govern this investigation&apos;s action.
          </p>
        </div>
        <button
          onClick={() => setShowAllPolicies((v) => !v)}
          className="flex items-center gap-1 font-mono text-[11px] text-muted hover:text-white transition-colors"
        >
          <span>{showAllPolicies ? "Hide policy registry" : "View policy details"}</span>
          {showAllPolicies ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Primary Applied Policy Card */}
      <div className="p-4 rounded-xl border border-purple-500/30 bg-[#120a1a]/70 shadow-lg mb-3">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-purple-500/20">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded font-mono text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
              RULE {pd.rule}
            </span>
            <h4 className="font-sans text-sm font-bold text-white">{pd.title}</h4>
          </div>
          <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
            Approval Authority: {pd.route}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans mt-3">
          <div>
            <span className="font-mono text-[10px] text-muted uppercase tracking-wider block mb-1">
              Triggering Policy Condition:
            </span>
            <p className="text-[#cbd5e1] leading-relaxed bg-black/40 p-2.5 rounded-lg border border-white/[.04]">
              {pd.condition}
            </p>
          </div>

          <div>
            <span className="font-mono text-[10px] text-muted uppercase tracking-wider block mb-1">
              Prescribed Enforcement Action:
            </span>
            <div className="bg-black/40 p-2.5 rounded-lg border border-white/[.04] font-mono text-emerald-400 font-bold">
              {pd.action}
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Policy Catalog */}
      {showAllPolicies && (
        <div className="mt-4 pt-4 border-t border-white/[.06] space-y-2 animate-in fade-in duration-200">
          <span className="font-mono text-[10px] text-muted uppercase tracking-wider block mb-2 font-semibold">
            Institutional Policy Rulebook (R1 - R10):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            {allPolicies.map((p) => {
              const isActive = p.rule === pd.rule;
              return (
                <div
                  key={p.rule}
                  className={`p-2.5 rounded-lg border transition-all ${
                    isActive
                      ? "bg-purple-500/15 border-purple-500/40 text-white"
                      : "bg-black/40 border-white/[.04] text-muted"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">
                      {p.rule} — {p.title}
                    </span>
                    <span className="text-[10px] text-dim">{p.route}</span>
                  </div>
                  <p className="text-[11px] font-sans line-clamp-2">{p.condition}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
