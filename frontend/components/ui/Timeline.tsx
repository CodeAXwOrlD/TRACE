import type { Transaction } from "@/lib/types";
import { formatTimestamp, formatUsd } from "@/lib/utils";

export interface TimelineProps {
  transactions: Transaction[];
  flaggedId?: string;
  firstSuspiciousId?: string | null;
  episodeTxnIds?: string[];
}

/**
 * Horizontal points on a thin line (Design.md §7).
 * - Origin / first suspicious transaction = red point + "Fraud began here"
 * - Flagged transaction = larger blue point + "Flagged"
 * - Episode transactions = highlighted point
 * - Normal transaction = grey point
 * NOTE: risk_score is NEVER used to decide suspicious transactions (Rules.md #1).
 */
export function Timeline({
  transactions,
  flaggedId,
  firstSuspiciousId,
  episodeTxnIds = [],
}: TimelineProps) {
  if (transactions.length === 0) {
    return <div className="text-muted text-sm font-mono py-6">No transactions in this window.</div>;
  }

  return (
    <div className="relative py-8">
      <div className="absolute left-0 right-0 top-1/2 h-px bg-white/10" aria-hidden="true" />
      <div className="flex justify-between relative overflow-x-auto pb-4 gap-4">
        {transactions.map((t) => {
          const isFlagged = t.id === flaggedId;
          const isOrigin = Boolean(firstSuspiciousId && t.id === firstSuspiciousId);
          const isEpisode = Boolean(episodeTxnIds.includes(t.id) && !isOrigin && !isFlagged);

          return (
            <div key={t.id} className="flex flex-col items-center gap-2 text-center" style={{ minWidth: 96 }}>
              <span
                className={
                  "rounded-full border-2 transition-all " +
                  (isFlagged
                    ? "w-4 h-4 bg-blue border-blue shadow-[0_0_10px_rgba(62,155,208,0.7)]"
                    : isOrigin
                    ? "w-3.5 h-3.5 bg-red border-red shadow-[0_0_10px_rgba(255,75,66,0.7)]"
                    : isEpisode
                    ? "w-2.5 h-2.5 bg-red/60 border-red"
                    : "w-2 h-2 bg-dim border-dim")
                }
                aria-hidden="true"
              />
              <span className="font-mono text-[10px] text-muted">{formatTimestamp(t.timestamp)}</span>
              <span className="font-mono text-xs text-[#dfe4e8]">{formatUsd(t.amount)}</span>
              {isOrigin && (
                <span className="text-[10px] text-red font-mono font-semibold tracking-tight">
                  Fraud began here
                </span>
              )}
              {isFlagged && (
                <span className="text-[10px] text-blue font-mono font-semibold tracking-tight">
                  Flagged
                </span>
              )}
              {isEpisode && (
                <span className="text-[9px] text-[#ff9a52] font-mono">Episode</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
