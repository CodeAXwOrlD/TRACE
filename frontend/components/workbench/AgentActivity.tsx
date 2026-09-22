"use client";

import type { AgentEvent } from "@/lib/types";

/**
 * Real-time agent activity panel. Fed by useInvestigationStream() (mock
 * events today, SSE once Member 2/3's backend is live — see lib/sse.ts).
 * Deliberately dumb: it just renders whatever events it's given.
 */
export function AgentActivity({ events, caseId, isRunning }: { events: AgentEvent[]; caseId: string; isRunning: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-[#b3bcc5] mb-3">
        <span className={`w-1.5 h-1.5 rounded-full bg-green ${isRunning ? "animate-pulse" : ""}`} aria-hidden="true" />
        AGENT {isRunning ? "INVESTIGATING" : "IDLE"} {caseId}
      </div>
      <ol className="space-y-1" aria-live="polite">
        {events.length === 0 && <li className="text-dim font-mono text-xs">Waiting to start…</li>}
        {events.map((e, i) => {
          const isLast = i === events.length - 1;
          return (
            <li key={e.id} className={`flex gap-2 font-mono text-[11px] ${isLast && isRunning ? "text-[#aeb8c1]" : "text-[#7d8894]"}`}>
              <i className={`not-italic w-3 shrink-0 ${isLast && isRunning ? "text-orange" : "text-green"}`}>{isLast && isRunning ? "›" : "✓"}</i>
              {e.description}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
