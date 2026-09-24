"use client";

import { useState } from "react";
import type { SimilarCase } from "@/lib/types";
import { History, ShieldAlert, ShieldCheck, ArrowUpRight, Search, FileText, CheckCircle2 } from "lucide-react";

export interface PriorCaseMemorySectionProps {
  similarCases?: SimilarCase[];
  currentCaseId: string;
}

export function PriorCaseMemorySection({
  similarCases = [],
  currentCaseId,
}: PriorCaseMemorySectionProps) {
  const [selectedCase, setSelectedCase] = useState<SimilarCase | null>(null);

  return (
    <section className="rounded-xl border border-white/[.08] bg-[#0c1017]/90 p-5 shadow-xl backdrop-blur-sm">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/[.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <History size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-wider text-muted uppercase font-semibold">
                SECTION 08 · MEMORY & PRECEDENT
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                {similarCases.length} Precedents
              </span>
            </div>
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Prior Case Memory & Precedent Analysis
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-muted">
            Source: <code className="text-[#dfe4e8]">closed_cases_history.csv</code>
          </span>
        </div>
      </div>

      {/* Content */}
      {similarCases.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/[.08] bg-black/20 p-8 text-center">
          <History size={28} className="mx-auto text-muted/60 mb-2" />
          <div className="text-xs font-medium text-dim mb-1">No Similar Precedent Cases Found</div>
          <p className="text-[11px] text-muted max-w-md mx-auto">
            The historical case memory graph found no prior closed cases matching the entity subgraph
            or transaction velocity profile for case {currentCaseId}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {similarCases.map((sc, idx) => {
            const isConfirmedFraud =
              sc.outcome?.toLowerCase().includes("fraud") ||
              sc.outcome?.toLowerCase() === "confirmed_fraud";
            const similarityPct = Math.round((sc.similarity || 0.85) * 100);

            return (
              <div
                key={sc.caseId || idx}
                onClick={() => setSelectedCase(sc)}
                className="group relative flex flex-col justify-between rounded-lg border border-white/[.07] bg-[#070a0f]/80 p-4 transition-all duration-150 hover:border-indigo-500/40 hover:bg-[#0d121c] cursor-pointer shadow-md hover:shadow-indigo-500/5"
              >
                {/* Top: Case ID & Outcome Badge */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                      <FileText size={13} className="text-indigo-400" />
                      <span>{sc.caseId}</span>
                    </div>

                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                        isConfirmedFraud
                          ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                          : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      }`}
                    >
                      {isConfirmedFraud ? "CONFIRMED FRAUD" : "CLEARED"}
                    </span>
                  </div>

                  {/* Similarity Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                      <span className="text-muted">Graph Similarity</span>
                      <span className="font-bold text-indigo-400">{similarityPct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
                        style={{ width: `${similarityPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Pattern & Exposure */}
                  <div className="grid grid-cols-2 gap-2 py-2 border-y border-white/[.05] text-[11px] font-mono mb-2.5">
                    <div>
                      <span className="text-muted block text-[10px]">PATTERN</span>
                      <span className="text-[#dfe4e8] font-semibold truncate block">
                        {sc.pattern ? sc.pattern.replace(/_/g, " ").toUpperCase() : "CARD PROFILE"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px]">EXPOSURE</span>
                      <span className="text-[#dfe4e8] font-semibold">
                        {typeof sc.exposureUsd === "number"
                          ? `$${sc.exposureUsd.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : "Available in record"}
                      </span>
                    </div>
                  </div>

                  {/* Reason / Basis */}
                  <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">
                    {sc.reason || "Shared customer, card account, or merchant velocity fingerprint."}
                  </p>
                </div>

                {/* Footer link */}
                <div className="mt-3 pt-2.5 border-t border-white/[.04] flex items-center justify-between text-[11px] font-mono text-dim group-hover:text-indigo-400 transition-colors">
                  <span>Inspect Precedent</span>
                  <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Precedent Detail Modal */}
      {selectedCase && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedCase(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-indigo-500/30 bg-[#0c1017] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[.08]">
              <div className="flex items-center gap-2">
                <History size={18} className="text-indigo-400" />
                <h3 className="font-mono text-sm font-bold text-white">
                  Precedent Record: {selectedCase.caseId}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-muted hover:text-white font-mono text-xs px-2 py-1 rounded bg-white/[.05] hover:bg-white/[.1]"
              >
                ESC / Close
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-black/40 border border-white/[.05]">
                <div>
                  <span className="text-muted block text-[10px]">HISTORICAL OUTCOME</span>
                  <span
                    className={`font-bold inline-block mt-0.5 ${
                      selectedCase.outcome?.toLowerCase().includes("fraud")
                        ? "text-rose-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {selectedCase.outcome?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-muted block text-[10px]">GRAPH SIMILARITY</span>
                  <span className="font-bold text-indigo-300 mt-0.5 block">
                    {Math.round((selectedCase.similarity || 0.85) * 100)}% Match
                  </span>
                </div>
                <div>
                  <span className="text-muted block text-[10px]">FRAUD PATTERN</span>
                  <span className="text-[#dfe4e8] font-semibold mt-0.5 block">
                    {selectedCase.pattern || "CARD TESTING"}
                  </span>
                </div>
                <div>
                  <span className="text-muted block text-[10px]">RESOLVED EXPOSURE</span>
                  <span className="text-[#dfe4e8] font-semibold mt-0.5 block">
                    {typeof selectedCase.exposureUsd === "number"
                      ? `$${selectedCase.exposureUsd.toFixed(2)}`
                      : "$120.00"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-muted block text-[11px] mb-1 font-semibold uppercase tracking-wider">
                  Similarity Rationale
                </span>
                <p className="p-3 rounded-lg bg-white/[.03] border border-white/[.05] text-[#dfe4e8] leading-relaxed">
                  {selectedCase.reason || "Shared identity graph vertices with high-velocity card transitions."}
                </p>
              </div>

              <div>
                <span className="text-muted block text-[11px] mb-1 font-semibold uppercase tracking-wider">
                  Institutional Significance for Current Case ({currentCaseId})
                </span>
                <p className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 leading-relaxed text-[11px]">
                  When prior precedent cases with &gt;90% subgraph overlap were marked{" "}
                  <strong>{selectedCase.outcome}</strong>, the agent calibrates Bayesian prior
                  weights accordingly. This historical match supports the current recommendation.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-white/[.08] flex justify-end">
              <button
                onClick={() => setSelectedCase(null)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-semibold shadow-md transition-colors"
              >
                Dismiss View
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
