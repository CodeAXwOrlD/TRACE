"use client";

import { useEffect } from "react";

export default function ConsoleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring if needed
    console.error("Console route error boundary caught:", error);
  }, [error]);

  return (
    <div className="py-16 text-center max-w-md mx-auto" role="alert">
      <div className="font-mono text-xs text-red uppercase tracking-wider mb-2 font-semibold">
        SYSTEM FAULT / API ERROR
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Failed to load console data</h2>
      <p className="text-xs text-muted leading-relaxed mb-6 font-mono bg-white/[.02] p-3 rounded border border-white/[.08]">
        {error.message || "An unexpected error occurred while communicating with the backend."}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="bg-orange hover:bg-orange/90 text-white font-mono text-xs font-semibold px-4 py-2 rounded transition-colors shadow-md"
      >
        Retry Request
      </button>
    </div>
  );
}
