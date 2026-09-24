"use client";

import { useEffect, useState } from "react";
import type { RiskAssessment } from "@/lib/types";
import { RiskBadge } from "@/components/ui/RiskBadge";

/** Animated number count-up for the fraud probability. Rules.md #1: risk_score is shown
 * separately and is never itself the probability label. */
function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(target);
      return;
    }
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

export function RiskScore({ risk }: { risk: RiskAssessment }) {
  const hasProb = risk.probability !== null && !isNaN(risk.probability);
  const targetPct = hasProb ? (risk.probability as number) * 100 : 0;
  const pct = useCountUp(targetPct);
  const normVerdict = (risk.verdict || "PENDING").toUpperCase();
  const toneColor =
    normVerdict === "FRAUD"
      ? "text-red"
      : normVerdict === "LEGITIMATE"
      ? "text-green"
      : normVerdict === "UNCERTAIN"
      ? "text-amber"
      : "text-muted";

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-2">
          {hasProb ? (
            <span className={`text-4xl font-extrabold tracking-tight font-sans ${toneColor}`}>
              {Math.round(pct)}%
            </span>
          ) : (
            <span className="text-2xl font-bold tracking-tight text-muted font-sans">
              Pending
            </span>
          )}
          <span className="font-mono text-[11px] text-muted uppercase">
            {hasProb ? "Fraud Prob" : "Evaluation"}
          </span>
        </div>
        <RiskBadge verdict={risk.verdict} />
      </div>

      <div className="font-mono text-[11px] text-muted mb-4 flex items-center justify-between border-b border-white/[.06] pb-2">
        <span>Confidence / Uncertainty:</span>
        <span className="text-[#dfe4e8] font-semibold uppercase">{risk.uncertainty || "HIGH"}</span>
      </div>

      <div className="space-y-2.5 text-xs font-mono">
        <ScoreRow
          label="Risk score (ML input)"
          value={risk.riskScore}
          color="bg-[#68737e]"
        />
        <ScoreRow
          label="Fraud probability (Agent)"
          value={risk.probability}
          color={normVerdict === "FRAUD" ? "bg-red" : normVerdict === "LEGITIMATE" ? "bg-green" : "bg-amber"}
        />
      </div>

      <p className="text-[11px] text-[#6b7681] mt-3 leading-relaxed">
        Risk score is detection model input. Fraud probability is calibrated from evidence.
      </p>
    </div>
  );
}

function ScoreRow({ label, value, color }: { label: string; value: number | null; color: string }) {
  const isAvailable = value !== null && !isNaN(value);
  const displayVal = isAvailable ? value.toFixed(2) : "—";
  const barWidth = isAvailable ? `${Math.min(Math.max(value * 100, 0), 100)}%` : "0%";

  return (
    <div className="grid grid-cols-[145px_1fr_40px] items-center gap-2.5">
      <span className="text-muted text-[11px] truncate">{label}</span>
      <div className="h-1.5 rounded-full bg-white/[.07] overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-[width] duration-700`}
          style={{ width: barWidth }}
        />
      </div>
      <output className="font-mono text-[11px] text-right text-[#e4e8ec]">
        {displayVal}
      </output>
    </div>
  );
}
