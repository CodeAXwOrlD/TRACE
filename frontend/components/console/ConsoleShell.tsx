"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { CommandPalette } from "@/components/workbench/CommandPalette";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { useGraphStatus } from "@/hooks/useGraphStatus";
import { TraceLogo } from "@/components/brand/TraceLogo";

const links = [
  { href: "/investigations", label: "Investigations" },
  { href: "/cases", label: "Cases" },
  { href: "/investigations/inv-hhg-007", label: "Graph" },
  { href: "/settings", label: "System" },
];

/**
 * Console-wide chrome for every page under app/(console)/: top nav, unified system
 * graph connectivity status, and the Cmd/Ctrl+K command palette.
 */
export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useCommandPalette();
  const graphStatus = useGraphStatus();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 h-16 px-6 flex items-center justify-between border-b border-white/[.06] bg-[rgba(5,6,8,.85)] backdrop-blur-xl">
        <div className="flex items-center gap-8">
          <Link href="/investigations" className="flex items-center gap-2.5">
            <TraceLogo size="sm" />
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-sans font-medium text-muted">
            {links.map((l) => (
              <Link key={l.label} href={l.href} className="hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <StatusIndicator
            label={graphStatus.label}
            tone={graphStatus.tone}
            pulse={graphStatus.isLive}
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
