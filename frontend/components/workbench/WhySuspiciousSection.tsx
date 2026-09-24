"use client";

import type { EvidenceItem, Investigation } from "@/lib/types";
import { ShieldAlert, Network, Cpu, Database, UserCheck, Layers } from "lucide-react";

export function WhySuspiciousSection({
  investigation,
  onAddEvidenceClick,
}: {
  investigation: Investigation;
  onAddEvidenceClick?: () => void;
}) {
  const evidenceList = investigation.evidence || [];

  const getSourceIcon = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes("graph")) return <Network size={13} className="text-blue" />;
    if (s.includes("model")) return <Cpu size={13} className="text-orange" />;
    if (s.includes("case") || s.includes("memory")) return <Database size={13} className="text-purple-400" />;
    if (s.includes("customer")) return <UserCheck size={13} className="text-emerald-400" />;
    return <Layers size={13} className="text-muted" />;
  };

  const getDirectionBadge = (tag?: string) => {
    if (tag === "raises_concern") {
      return (
        <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-red/15 text-red border border-red/30 font-semibold uppercase">
          Raises Concern
        </span>
      );
    }
    if (tag === "lowers_concern") {
      return (
        <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-green/15 text-green border border-green/30 font-semibold uppercase">
          Lowers Concern
        </span>
      );
    }
    return (
      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-white/[.08] text-muted border border-white/10 uppercase">
        Context
      </span>
    );
  };

  return (
    <div className="rounded-xl border border-white/[.1] bg-[#0c1017]/90 p-5 shadow-xl">
      {/* Title Bar */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/[.08]">
        <div>
          <span className="font-mono text-xs font-bold tracking-wider text-orange uppercase block">
            SECTION 2 • WHY THIS CASE IS SUSPICIOUS
          </span>
          <p className="text-xs text-muted font-sans mt-0.5">
            Key empirical evidence claims, entity provenance, and analytical significance.
          </p>
        </div>
        {onAddEvidenceClick && (
          <button
            onClick={onAddEvidenceClick}
            className="font-mono text-[11px] font-semibold text-orange hover:text-white bg-orange/10 hover:bg-orange border border-orange/40 px-3 py-1.5 rounded-lg transition-all shadow-sm"
          >
            + Add Evidence
          </button>
        )}
      </div>

      {/* Grid of Evidence Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {evidenceList.map((ev, idx) => {
          const entities = ev.entities && ev.entities.length > 0
            ? ev.entities
            : [investigation.customerId, investigation.cardId, investigation.triggerTransactionId].filter(Boolean);

          const whyItMatters =
            ev.whyItMatters ||
            (ev.tag === "raises_concern"
              ? "Strengthens the fraud hypothesis and elevates calculated risk."
              : "Supports legitimate activity and reduces anomaly concern.");

          return (
            <div
              key={ev.id || idx}
              className="p-4 rounded-xl border border-white/[.08] bg-black/40 hover:bg-white/[.02] transition-colors flex flex-col justify-between shadow-md"
            >
              <div>
                {/* Header: Source and Direction */}
                <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/[.06]">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-[#cbd5e1] font-semibold">
                    {getSourceIcon(ev.source)}
                    <span>{ev.source}</span>
                  </div>
                  {getDirectionBadge(ev.tag)}
                </div>

                {/* Evidence Claim */}
                <h4 className="font-sans text-xs font-bold text-white mb-2 leading-snug">
                  {ev.claim || ev.description}
                </h4>

                {/* Entity IDs */}
                <div className="mb-3">
                  <span className="font-mono text-[10px] text-muted block mb-1 uppercase tracking-wider">
                    Referenced Entities:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {entities.map((ent, eIdx) => (
                      <span
                        key={eIdx}
                        className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/[.05] text-[#dfe4e8] border border-white/10"
                      >
                        {String(ent)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Analytical Significance (Why It Matters) */}
              <div className="pt-2.5 border-t border-white/[.06]">
                <span className="font-mono text-[10px] text-orange block mb-0.5 uppercase tracking-wider font-semibold">
                  Why It Matters:
                </span>
                <p className="text-[11px] text-[#cbd5e1] leading-relaxed font-sans">
                  {whyItMatters}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
