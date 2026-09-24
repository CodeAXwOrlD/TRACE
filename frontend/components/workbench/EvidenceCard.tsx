import type { EvidenceItem } from "@/lib/types";
import { formatPct, formatTimestamp } from "@/lib/utils";

const severityColor: Record<EvidenceItem["severity"], string> = {
  high: "border-l-red",
  medium: "border-l-amber",
  low: "border-l-green",
};
const severityLabel: Record<EvidenceItem["severity"], string> = {
  high: "HIGH SIGNAL",
  medium: "MEDIUM SIGNAL",
  low: "LOW SIGNAL",
};

/** Every conclusion points to evidence (Rules.md #5) — this is the atomic unit that backs a verdict. */
export function EvidenceCard({ evidence }: { evidence: EvidenceItem }) {
  return (
    <div className={`rounded-lg border border-white/[.08] border-l-2 ${severityColor[evidence.severity]} bg-white/[.015] p-4`}>
      <div className="font-mono text-[10px] tracking-wider text-muted mb-2">{severityLabel[evidence.severity]}</div>
      <div className="text-[#dfe4e8] text-sm mb-2 leading-snug">{evidence.description}</div>
      <div className="flex items-center justify-between font-mono text-[11px] text-dim">
        <span>{evidence.source}</span>
        <span>Confidence {formatPct(evidence.confidence)}</span>
      </div>
      <div className="font-mono text-[10px] text-dim mt-1" suppressHydrationWarning>{formatTimestamp(evidence.timestamp)}</div>
    </div>
  );
}
