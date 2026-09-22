"use client";

import Link from "next/link";

export default function InvestigationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="py-20 text-center max-w-lg mx-auto" role="alert">
      <div className="font-mono text-xs text-red uppercase tracking-wider mb-2 font-semibold">
        INVESTIGATION FAULT
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Unable to retrieve investigation</h2>
      <p className="text-xs text-muted font-mono leading-relaxed mb-6 bg-white/[.02] p-3 rounded border border-white/[.08]">
        {error.message || "Failed to load investigation graph or evidence payload from the backend."}
      </p>
      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="bg-orange hover:bg-orange/90 text-white font-mono text-xs font-semibold px-4 py-2 rounded transition-colors shadow-md"
        >
          Retry Workspace
        </button>
        <Link
          href="/investigations"
          className="border border-white/20 hover:border-white text-muted hover:text-white font-mono text-xs px-4 py-2 rounded transition-colors"
        >
          ← Back to Investigations
        </Link>
      </div>
    </div>
  );
}
