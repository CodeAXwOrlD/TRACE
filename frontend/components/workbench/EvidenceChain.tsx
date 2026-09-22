"use client";

import { useMemo } from "react";
import type { AgentEvent, Investigation } from "@/lib/types";

export interface EvidenceChainProps {
  investigation: Investigation;
  events?: AgentEvent[];
}

interface ChainStep {
  num: string;
  title: string;
  val: string;
  desc: string;
  tag?: { label: string; tone: "concern" | "ease" | "ctx" };
  isDecision?: boolean;
  actions?: string[];
}

/**
 * The Signature Evidence-to-Decision Chain (PRD.md §8 FR-9 & Design.md §7).
 * Connects the flagged transaction through look-back, connected devices,
 * retrieved historical cases, detected pattern, and calibrated probability
 * down to the policy engine and next best actions.
 * Dynamically reacts to real-time SSE agent events.
 */
export function EvidenceChain({ investigation, events = [] }: EvidenceChainProps) {
  // Determine how many steps are unlocked based on agent events
  const eventTypes = useMemo(() => new Set(events.map((e) => e.type)), [events]);
  const isStreaming = events.length > 0 && !eventTypes.has("investigation_complete");

  const steps: ChainStep[] = [
    {
      num: "01",
      title: "FLAGGED TRANSACTION",
      val: `${investigation.triggerTransactionId} · Risk score ${investigation.risk.riskScore.toFixed(2)}`,
      desc: "Flagged online authorization entered queue. Score is an input, not a verdict.",
      tag: { label: "Input Trigger", tone: "ctx" },
    },
    {
      num: "02",
      title: "CARD HISTORY & LOOK-BACK",
      val: investigation.firstSuspiciousTxnId
        ? `Episode begins at ${investigation.firstSuspiciousTxnId} (3 small charges)`
        : "Standard recurring activity on this card history",
      desc: investigation.firstSuspiciousTxnId
        ? "Look-back walker identified micro-authorizations testing card validity."
        : "Look-back found no preceding anomalous burst.",
      tag: investigation.firstSuspiciousTxnId
        ? { label: "Raises concern", tone: "concern" }
        : { label: "Lowers concern", tone: "ease" },
    },
    {
      num: "03",
      title: "DEVICE & ENTITY GRAPH",
      val: investigation.connectedCardIds?.length
        ? `Device shared across ${investigation.connectedCardIds.length + 1} cards`
        : "Known device profile consistent with customer identity",
      desc: investigation.connectedCardIds?.length
        ? `Cross-card graph link on new device profile (${investigation.connectedCardIds.join(", ")}).`
        : "Device matches registered customer fingerprint.",
      tag: investigation.connectedCardIds?.length
        ? { label: "Raises concern", tone: "concern" }
        : { label: "Lowers concern", tone: "ease" },
    },
    {
      num: "04",
      title: "HISTORICAL CASE MEMORY",
      val: investigation.similarCases?.length
        ? `${investigation.similarCases.length} similar past cases retrieved (Top: ${investigation.similarCases[0]?.caseId})`
        : "No direct historical fraud overlap found in memory",
      desc: investigation.similarCases?.length
        ? `Case similarity ${Math.round((investigation.similarCases[0]?.similarity ?? 0.9) * 100)}% with outcome: ${investigation.similarCases[0]?.outcome}.`
        : "Closed case repository indicates no related confirmed clusters.",
      tag: investigation.similarCases?.some((c) => c.outcome.includes("fraud"))
        ? { label: "Raises concern", tone: "concern" }
        : { label: "Context", tone: "ctx" },
    },
    {
      num: "05",
      title: "PATTERN DETECTION",
      val: investigation.pattern
        ? investigation.pattern.toUpperCase().replace(/_/g, " ")
        : "NO KNOWN FRAUD PATTERN",
      desc: investigation.pattern
        ? "Deterministic pattern detector classified anomaly signature."
        : "Case does not match any abusive pattern signature.",
      tag: investigation.pattern
        ? { label: "Pattern Detected", tone: "concern" }
        : { label: "Clean Activity", tone: "ease" },
    },
    {
      num: "06",
      title: "CALIBRATED PROBABILITY",
      val: `${Math.round(investigation.risk.probability * 100)}% Fraud Probability`,
      desc: "Logistic evidence weighting + prior shift (corrected for 50/50 hackathon distribution).",
      tag:
        investigation.risk.verdict === "FRAUD"
          ? { label: "High probability", tone: "concern" }
          : investigation.risk.verdict === "LEGITIMATE"
          ? { label: "Low probability", tone: "ease" }
          : { label: "Borderline probability", tone: "ctx" },
      isDecision: true,
    },
    {
      num: "07",
      title: "UNCERTAINTY LEVEL",
      val: `${investigation.risk.uncertainty} UNCERTAINTY`,
      desc: "Measured from evidence convergence, device presence, and historical case agreement.",
      tag: { label: "Calibrated Confidence", tone: "ctx" },
    },
    {
      num: "08",
      title: "POLICY APPLIED",
      val: investigation.policy ? `Policy ${investigation.policy.policyId}` : "Standard Policy",
      desc: "Data-driven policy rule matched from evidence conditions and exposure thresholds.",
      tag: { label: "Automated Policy", tone: "ctx" },
    },
    {
      num: "09",
      title: "NEXT BEST ACTIONS",
      val: investigation.risk.verdict,
      desc: "Deterministic next action recommendations for the analyst and automated defense.",
      actions: investigation.policy?.actions ?? ["MONITOR"],
      isDecision: true,
    },
  ];

  // Calculate unlock index if streaming
  const unlockedCount = isStreaming
    ? Math.min(steps.length, Math.max(2, Math.floor(events.length * 1.3)))
    : steps.length;

  return (
    <div className="relative pl-6 py-2">
      {/* Background Vertical Rail */}
      <div className="absolute left-[15px] top-4 bottom-8 w-[2px] bg-white/[.08]" aria-hidden="true">
        <div
          className="w-full bg-gradient-to-b from-orange via-blue to-green transition-all duration-700"
          style={{ height: `${(unlockedCount / steps.length) * 100}%` }}
        />
      </div>

      <div className="space-y-6">
        {steps.map((step, idx) => {
          const isUnlocked = idx < unlockedCount;
          const isCurrent = idx === unlockedCount - 1 && isStreaming;

          const dotBorderColor =
            step.tag?.tone === "concern"
              ? "border-red text-red"
              : step.tag?.tone === "ease"
              ? "border-green text-green"
              : "border-blue text-blue";

          const dotBg = isUnlocked
            ? step.tag?.tone === "concern"
              ? "bg-red"
              : step.tag?.tone === "ease"
              ? "bg-green"
              : "bg-blue"
            : "bg-[#0a0e13]";

          return (
            <div
              key={step.num}
              className={`relative flex items-start gap-4 transition-all duration-500 ${
                isUnlocked ? "opacity-100 translate-x-0" : "opacity-25 translate-x-1"
              }`}
            >
              {/* Timeline Dot Node */}
              <div
                className={`relative z-10 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center font-mono text-[9px] font-bold ${dotBorderColor} ${
                  isCurrent ? "animate-pulse ring-4 ring-orange/30" : ""
                }`}
                style={{ backgroundColor: isUnlocked ? undefined : "#0a0e13" }}
              >
                <span className={`w-2 h-2 rounded-full ${dotBg}`} />
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0 bg-white/[.015] border border-white/[.06] rounded-lg p-3 hover:border-white/20 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-dim">{step.num}</span>
                    <span className="font-mono text-[11px] font-semibold tracking-wider text-[#aab3bc]">
                      {step.title}
                    </span>
                  </div>
                  {step.tag && (
                    <span
                      className={`font-mono text-[9px] px-1.5 py-0.5 rounded border ${
                        step.tag.tone === "concern"
                          ? "text-red border-red/40 bg-red/10"
                          : step.tag.tone === "ease"
                          ? "text-green border-green/40 bg-green/10"
                          : "text-blue border-blue/40 bg-blue/10"
                      }`}
                    >
                      {step.tag.label}
                    </span>
                  )}
                </div>

                <div
                  className={`font-mono font-semibold mb-1 truncate ${
                    step.isDecision ? "text-base text-white" : "text-sm text-[#dfe4e8]"
                  }`}
                >
                  {step.val}
                </div>

                <p className="text-xs text-muted leading-relaxed">{step.desc}</p>

                {step.actions && (
                  <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-white/[.06]">
                    {step.actions.map((act, actIdx) => (
                      <span
                        key={act}
                        className={`font-mono text-[10px] px-2 py-1 rounded border tracking-wider font-semibold ${
                          actIdx === 0
                            ? "bg-white text-[#0a0e13] border-white shadow-sm"
                            : "bg-white/[.03] text-[#dfe4e8] border-white/20"
                        }`}
                      >
                        {act}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
