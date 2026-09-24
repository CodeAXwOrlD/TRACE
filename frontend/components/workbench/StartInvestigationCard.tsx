"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startInvestigation } from "@/lib/api";

export function StartInvestigationCard() {
  const router = useRouter();
  const [transactionId, setTransactionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = transactionId.trim();
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const inv = await startInvestigation(id);
      router.push(`/investigations/${inv.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start investigation");
      setLoading(false);
    }
  };

  const setPreset = (id: string) => {
    setTransactionId(id);
    setError(null);
  };

  return (
    <div className="rounded-panel border border-white/[.12] bg-gradient-to-r from-[#0d1218] via-[#0a0e13] to-[#070a0e] p-5 shadow-lg mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-orange animate-pulse" />
            <span className="font-mono text-[10px] tracking-wider text-orange uppercase font-semibold">
              CASE INTAKE (PRD P0 / FR-1)
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Start New Investigation
          </h2>
          <p className="text-xs text-muted max-w-xl mt-1">
            Provide a flagged <code className="text-[#dfe4e8]">transaction_id</code> to walk the card graph, follow shared devices, retrieve similar cases, and generate defensible intelligence.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch gap-2 min-w-[320px]">
          <input
            type="text"
            placeholder="e.g. txn-flagged"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            disabled={loading}
            className="bg-[#050608] border border-white/20 rounded px-3 py-2 font-mono text-xs text-white placeholder-dim focus:outline-none focus:border-orange flex-1 min-w-[180px]"
          />
          <button
            type="submit"
            disabled={loading || !transactionId.trim()}
            className="inline-flex items-center justify-center gap-2 bg-[#ec6408] hover:bg-[#ff7418] text-white font-sans text-xs font-semibold px-5 py-2.5 rounded-lg transition-all shadow-[0_4px_20px_rgba(236,100,8,0.3)] hover:shadow-[0_8px_25px_rgba(236,100,8,0.5)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap cursor-pointer"
          >
            {loading ? "Starting…" : "Investigate Case →"}
          </button>
        </form>
      </div>

      {/* Quick Select Presets */}
      <div className="mt-3 pt-3 border-t border-white/[.06] flex items-center gap-2 text-xs flex-wrap">
        <span className="font-mono text-[10px] text-dim">Quick Intakes:</span>
        <button
          type="button"
          onClick={() => setPreset("txn-flagged")}
          className="font-mono text-[10px] bg-white/[.04] hover:bg-white/[.08] text-[#dfe4e8] px-2 py-0.5 rounded border border-white/10"
        >
          txn-flagged (Card testing / CNP)
        </button>
        <button
          type="button"
          onClick={() => setPreset("txn-legit-1")}
          className="font-mono text-[10px] bg-white/[.04] hover:bg-white/[.08] text-[#dfe4e8] px-2 py-0.5 rounded border border-white/10"
        >
          txn-legit-1 (Legitimate recurring)
        </button>
        <button
          type="button"
          onClick={() => setPreset("txn-unsure-1")}
          className="font-mono text-[10px] bg-white/[.04] hover:bg-white/[.08] text-[#dfe4e8] px-2 py-0.5 rounded border border-white/10"
        >
          txn-unsure-1 (Conflicting evidence)
        </button>
      </div>

      {error && (
        <div className="mt-3 text-xs font-mono text-red bg-red/10 border border-red/30 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
