"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { CommandPalette } from "@/components/workbench/CommandPalette";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { getHealth } from "@/lib/api";

const links = [
  { href: "/investigations", label: "Investigations" },
  { href: "/cases", label: "Cases" },
  { href: "/investigations", label: "Graph" }, // graph lives inside an investigation workspace
  { href: "/settings", label: "System" },
];

/**
 * Console-wide chrome for every page under app/(console)/: top nav, system
 * status row, and the Cmd/Ctrl+K command palette (project prompt sections
 * 7 and 18).
 */
export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useCommandPalette();
  const [graphConnected, setGraphConnected] = useState(true);

  useEffect(() => {
    getHealth()
      .then((h) => setGraphConnected(h.tigergraph === "connected"))
      .catch(() => setGraphConnected(false));
  }, []);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 h-16 px-6 flex items-center justify-between border-b border-white/[.06] bg-[rgba(5,6,8,.75)] backdrop-blur-xl">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="font-bold tracking-[0.18em] text-sm flex items-center gap-2.5">
            <span className="w-[18px] h-[18px] border-[1.5px] border-orange rotate-45 relative" />
            TRACE
          </Link>
          <nav className="hidden md:flex gap-6 text-sm text-muted">
            {links.map((l) => (
              <Link key={l.label} href={l.href} className="hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-5">
          <StatusIndicator
            label={graphConnected ? "GRAPH CONNECTED" : "GRAPH OFFLINE"}
            tone={graphConnected ? "green" : "red"}
            pulse={false}
          />
          <button
            onClick={() => setOpen(true)}
            className="font-mono text-[11px] text-muted border border-white/10 rounded px-2.5 py-1.5 hover:text-white hover:border-white/30 transition-colors"
          >
            ⌘K search
          </button>
        </div>
      </header>
      <main className="px-6 py-8 max-w-[1400px] mx-auto">{children}</main>
      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
