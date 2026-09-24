"use client";

import type { Investigation } from "@/lib/types";
import { HelpCircle, AlertTriangle, ShieldQuestion, FileQuestion, ArrowRight, CheckCircle2 } from "lucide-react";

export interface UncertaintySectionProps {
  investigation: Investigation;
  onRequestEvidence?: () => void;
}

export function UncertaintySection({ investigation, onRequestEvidence }: UncertaintySectionProps) {
  const ua = investigation.uncertaintyAssessment;
  const uncertainty = investigation.risk?.uncertainty || "HIGH";
  const confidencePct = ua?.confidence ? Math.round(ua.confidence * 100) : (uncertainty === "LOW" ? 90 : uncertainty === "MEDIUM" ? 75 : 55);

  const conflictingEvidence = ua?.conflicting_evidence || [];
  const missingEvidence = ua?.missing_evidence || (
    uncertainty === "HIGH"
      ? ["Cardholder two-factor step-up confirmation", "Observed device behavioral biometrics"]
      : []
  );

  const evidenceRequest = ua?.evidence_request || {
    type: uncertainty === "HIGH" ? "Customer Step-Up Authentication" : "Not Required",
    requested_after_step: "TigerGraph Neighborhood Traversal",
    assumed_response: investigation.risk?.verdict === "UNCERTAIN" ? "Pending cardholder verification via secure mobile channel" : "Direct telemetry confirmed signal convergence",
    impact: `Directed final operational triage to policy ${investigation.policy?.policyId || "R9"}`,
  };

  const whyNeeded =
    ua?.why_needed ||
    (uncertainty === "HIGH"
      ? "Ambiguous multi-source telemetry requires secondary validation or human escalation before permanent card restriction."
      : "Multi-signal graph convergence provides sufficient statistical confidence for automated policy enforcement.");

  return (
    <div className="rounded-xl border border-white/[.1] bg-[#0c1017]/90 p-5 shadow-xl">
      {/* Title Bar */}
      <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-white/[.08]">
        <div>
          <span className="font-mono text-xs font-bold tracking-wider text-amber uppercase block">
            SECTION 5 • UNCERTAINTY ASSESSMENT & EVIDENCE REQUEST
          </span>
          <p className="text-xs text-muted font-sans mt-0.5">
            Explicit measurement of evidentiary ambiguity, conflicting signals, and step-up requests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`font-mono text-[11px] px-2.5 py-1 rounded-full border font-semibold uppercase ${
              uncertainty === "HIGH"
                ? "bg-amber-500/15 text-amber border-amber/40"
                : uncertainty === "MEDIUM"
                ? "bg-blue/15 text-blue border-blue/40"
                : "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
            }`}
          >
            {uncertainty} UNCERTAINTY ({confidencePct}% Confidence)
          </span>
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Uncertainty Measurement & Signals */}
        <div className="space-y-4">
          {/* Confidence Meter */}
          <div className="p-3.5 rounded-xl border border-white/[.06] bg-black/40">
            <div className="flex items-center justify-between font-mono text-xs mb-2">
              <span className="text-muted uppercase">Bayesian Confidence Calibration:</span>
              <strong className="text-white">{confidencePct}% Defensible</strong>
            </div>
            <div className="h-2 rounded-full bg-white/[.07] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  confidencePct >= 80 ? "bg-emerald-400" : confidencePct >= 65 ? "bg-amber" : "bg-red"
                }`}
                style={{ width: `${confidencePct}%` }}
              />
            </div>
          </div>

          {/* Why More Evidence Is Needed */}
          <div className="p-3.5 rounded-xl border border-white/[.06] bg-black/40">
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-amber mb-1.5">
              <HelpCircle size={13} />
              <span>WHY MORE EVIDENCE IS REQUIRED</span>
            </div>
            <p className="text-xs text-[#cbd5e1] font-sans leading-relaxed">
              {whyNeeded}
            </p>
          </div>

          {/* Conflicting Evidence */}
          <div className="p-3.5 rounded-xl border border-white/[.06] bg-black/40">
            <span className="font-mono text-[10px] text-muted uppercase tracking-wider block mb-1.5 font-semibold">
              Conflicting Evidence Signals:
            </span>
            {conflictingEvidence.length > 0 ? (
              <ul className="space-y-1.5 text-xs font-sans text-[#dfe4e8]">
                {conflictingEvidence.map((ce, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber">•</span>
                    <span>{ce}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted font-sans italic">
                No contradictory signals detected in graph neighborhood.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Evidence Request Dispatch & Impact */}
        <div className="space-y-4">
          {/* Evidence Request Card */}
          <div className="p-4 rounded-xl border border-amber/30 bg-[#161208]/70 shadow-lg">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-amber/20">
              <ShieldQuestion size={16} className="text-amber" />
              <span className="font-mono text-xs font-bold text-amber uppercase tracking-wider">
                ACTIVE EVIDENCE REQUEST DISPATCH
              </span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-white/[.04]">
                <span className="text-muted">Request Typology:</span>
                <span className="text-white font-bold">{evidenceRequest.type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[.04]">
                <span className="text-muted">Requested After:</span>
                <span className="text-[#dfe4e8]">{evidenceRequest.requested_after_step}</span>
              </div>
              <div className="py-1 border-b border-white/[.04]">
                <span className="text-muted block mb-0.5">Assumed / Expected Response:</span>
                <span className="text-amber font-sans text-xs">{evidenceRequest.assumed_response}</span>
              </div>
              <div className="py-1">
                <span className="text-muted block mb-0.5">Investigation Impact:</span>
                <span className="text-emerald-400 font-sans text-xs">{evidenceRequest.impact}</span>
              </div>
            </div>

            {onRequestEvidence && (
              <div className="mt-3 pt-2.5 border-t border-amber/20 flex justify-end">
                <button
                  onClick={onRequestEvidence}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber hover:bg-amber/90 text-black font-mono text-xs font-bold shadow-md transition-colors"
                >
                  <ArrowRight size={13} />
                  <span>Provide Analyst Evidence</span>
                </button>
              </div>
            )}
          </div>

          {/* Missing Evidence Checklist */}
          <div className="p-3.5 rounded-xl border border-white/[.06] bg-black/40">
            <span className="font-mono text-[10px] text-muted uppercase tracking-wider block mb-1.5 font-semibold">
              Pending Telemetry Inputs:
            </span>
            {missingEvidence.length > 0 ? (
              <ul className="space-y-1.5 text-xs font-mono text-[#cbd5e1]">
                {missingEvidence.map((me, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber" />
                    <span>{me}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted font-sans italic">
                All requisite evidentiary inputs successfully acquired.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
