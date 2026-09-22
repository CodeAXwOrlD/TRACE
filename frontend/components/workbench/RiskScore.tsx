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
  const pct = useCountUp(risk.probability * 100);
  const toneColor = risk.verdict === "FRAUD" ? "text-red" : risk.verdict === "LEGITIMATE" ? "text-green" : "text-amber";

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-1">
        <span className={`text-6xl font-extrabold tracking-tight ${toneColor}`}>{Math.round(pct)}%</span>
        <RiskBadge verdict={risk.verdict} />
      </div>
      <div className="font-mono text-xs text-muted mb-4">Fraud probability · {risk.uncertainty} uncertainty</div>
      <div className="space-y-2 text-sm">
        <ScoreRow label="Risk score (input only)" value={risk.riskScore} color="bg-[#68737e]" />
        <ScoreRow label="Fraud probability" value={risk.probability} color={risk.verdict === "FRAUD" ? "bg-red" : risk.verdict === "LEGITIMATE" ? "bg-green" : "bg-amber"} />
      </div>
      <p className="text-xs text-[#6b7681] mt-3 leading-relaxed">Score is one input. Probability comes from the evidence.</p>
    </div>
  );
}

function ScoreRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr_40px] items-center gap-3">
      <span className="text-muted text-xs">{label}</span>
      <div className="h-2 rounded bg-white/[.07] overflow-hidden">
        <div className={`h-full rounded ${color} transition-[width] duration-700`} style={{ width: `${value * 100}%` }} />
      </div>
      <output className="font-mono text-xs text-right text-[#e4e8ec]">{value.toFixed(2)}</output>
    </div>
  );
}
