"use client";

import { useState } from "react";
import type { EvidenceContractItem } from "@/lib/contracts";

export interface AddEvidenceDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (item: EvidenceContractItem) => Promise<void> | void;
}

const PRESETS: Array<{
  label: string;
  step: string;
  finding: string;
  direction: "concern" | "ease" | "context";
  weight: number;
}> = [
  {
    label: "Customer Dispute / Charge Denial",
    step: "customer_dispute",
    finding: "Customer filed affidavit denying authorization of transaction.",
    direction: "concern",
    weight: 0.15,
  },
  {
    label: "Customer Verified Legitimate Authorization",
    step: "customer_verification",
    finding: "Customer verified purchase via verified callback / biometric 2FA.",
    direction: "ease",
    weight: 0.25,
  },
  {
    label: "Device Flagged in External Consortium",
    step: "consortium_match",
    finding: "Device fingerprint flagged in darknet credential stuffing ring.",
    direction: "concern",
    weight: 0.18,
  },
  {
    label: "Known Home Billing IP Confirmed",
    step: "ip_reputation",
    finding: "ISP geolocation and residential IP match 3-year card billing history.",
    direction: "ease",
    weight: 0.12,
  },
];

export function AddEvidenceDialog({ open, onClose, onSubmit }: AddEvidenceDialogProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [customFinding, setCustomFinding] = useState("");
  const [customDirection, setCustomDirection] = useState<"concern" | "ease" | "context">("concern");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (selectedIdx === -1) {
        await onSubmit({
          step: "analyst_manual_entry",
          finding: customFinding || "Manual evidence added by investigator.",
          direction: customDirection,
          weight: 0.1,
        });
      } else {
        const preset = PRESETS[selectedIdx]!;
        await onSubmit({
          step: preset.step,
          finding: preset.finding,
          direction: preset.direction,
          weight: preset.weight,
        });
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-evidence-title"
    >
      <div className="w-full max-w-lg rounded-panel border border-white/[.12] bg-[#0a0e13] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4 border-b border-white/[.08] pb-3">
          <div>
            <div className="font-mono text-[10px] tracking-wider text-blue uppercase">INVESTIGATION INTERACTION</div>
            <h2 id="add-evidence-title" className="text-lg font-bold text-white tracking-tight">
              Add Evidence & Re-Score
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-dim hover:text-white text-xs px-2 py-1 rounded"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-muted mb-4 leading-relaxed">
          Inject structured evidence findings into the policy and scoring model (PRD.md §8 FR-14).
          The agent immediately recalibrates probability, shifts uncertainty, and updates the decision chain.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="font-mono text-[11px] text-[#dfe4e8]">Select standard evidence finding:</label>
            <div className="space-y-2">
              {PRESETS.map((preset, idx) => (
                <label
                  key={preset.label}
                  className={`flex items-start gap-3 p-2.5 rounded border cursor-pointer transition-colors ${
                    selectedIdx === idx
                      ? "bg-white/[.05] border-orange text-white"
                      : "bg-white/[.015] border-white/[.08] text-[#8894a0] hover:border-white/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="preset"
                    checked={selectedIdx === idx}
                    onChange={() => setSelectedIdx(idx)}
                    className="mt-0.5 accent-orange"
                  />
                  <div className="text-xs flex-1">
                    <div className="font-semibold text-[#dfe4e8] mb-0.5">{preset.label}</div>
                    <div className="text-muted leading-tight">{preset.finding}</div>
                    <span
                      className={`inline-block mt-1 font-mono text-[9px] px-1.5 py-0.2 rounded border ${
                        preset.direction === "concern"
                          ? "text-red border-red/30"
                          : "text-green border-green/30"
                      }`}
                    >
                      {preset.direction === "concern" ? "Raises Concern" : "Lowers Concern"}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/[.08]">
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-xs text-muted hover:text-white px-3 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-orange text-white hover:bg-orange/90 font-mono text-xs font-semibold px-4 py-2 rounded transition-all shadow-md disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "+ Add & Recalibrate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
