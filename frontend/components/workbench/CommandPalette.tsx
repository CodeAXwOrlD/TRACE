"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { startInvestigation } from "@/lib/api";

interface Command {
  label: string;
  hint?: string;
  run: (router: ReturnType<typeof useRouter>) => Promise<void> | void;
}

const defaultCommands: Command[] = [
  { label: "Open dashboard", hint: "overview", run: (r) => r.push("/dashboard") },
  { label: "Open investigations console", hint: "workspace", run: (r) => r.push("/investigations") },
  { label: "Open case queue", hint: "cases", run: (r) => r.push("/cases") },
  { label: "System settings & infrastructure health", hint: "health", run: (r) => r.push("/settings") },
];

/** Cmd/Ctrl+K palette (project prompt section 18). Opened via useCommandPalette(). */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setLoading(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  if (!open) return null;

  const trimmed = query.trim();
  const dynamicCommands: Command[] = [];

  if (trimmed.length > 2) {
    dynamicCommands.push({
      label: `Start investigation on "${trimmed}"`,
      hint: "intake action",
      run: async (r) => {
        setLoading(true);
        try {
          const inv = await startInvestigation(trimmed);
          r.push(`/investigations/${inv.id}`);
        } finally {
          setLoading(false);
        }
      },
    });
  }

  const allCommands = [...dynamicCommands, ...defaultCommands];
  const filtered = allCommands.filter((c) =>
    c.label.toLowerCase().includes(trimmed.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-lg rounded-panel border border-white/10 bg-panel shadow-panel overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            placeholder="Search case, transaction, customer, or type ID to investigate…"
            className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder:text-dim outline-none border-b border-white/10 font-mono"
          />
          {loading && (
            <span className="absolute right-3 top-3.5 font-mono text-[10px] text-orange animate-pulse">
              Intaking…
            </span>
          )}
        </div>

        <ul className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 && (
            <li className="px-4 py-3 text-dim text-sm font-mono">No matching commands.</li>
          )}
          {filtered.map((c) => (
            <li key={c.label}>
              <button
                className="w-full text-left px-4 py-2.5 text-sm text-[#dfe4e8] hover:bg-white/[.05] flex justify-between items-center transition-colors"
                onClick={async () => {
                  await c.run(router);
                  onClose();
                }}
              >
                <span>{c.label}</span>
                {c.hint && (
                  <span className="font-mono text-[10px] text-dim border border-white/10 rounded px-1.5 py-0.5">
                    {c.hint}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
        <div className="px-4 py-2 bg-white/[.02] border-t border-white/[.06] flex justify-between font-mono text-[10px] text-dim">
          <span>Navigation: Click or Enter</span>
          <span>Close: ESC</span>
        </div>
      </div>
    </div>
  );
}
