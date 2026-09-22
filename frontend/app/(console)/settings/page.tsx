"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { usingLiveBackend, API_BASE, getHealth } from "@/lib/api";
import type { HealthStatusContract } from "@/lib/contracts";

export default function SettingsPage() {
  const [health, setHealth] = useState<HealthStatusContract | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHealth = () => {
    setLoading(true);
    getHealth()
      .then(setHealth)
      .catch(() => {
        setHealth({
          status: "degraded",
          frontend: "online",
          fastapi: "offline",
          tigergraph: "disconnected",
          agent: "offline",
          llm: "offline",
          dataset: "missing",
          timestamp: new Date().toISOString(),
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="font-mono text-[11px] tracking-wider text-blue mb-1">SETTINGS & HEALTH</div>
          <h1 className="text-2xl font-bold tracking-tight">System Infrastructure</h1>
        </div>
        <button
          type="button"
          onClick={fetchHealth}
          disabled={loading}
          className="font-mono text-xs border border-white/20 hover:border-white px-3 py-1.5 rounded transition-colors text-muted hover:text-white"
        >
          {loading ? "Checking…" : "Ping /api/health"}
        </button>
      </div>

      <Panel title="SERVICE HEALTH STATUS (GET /api/health)" className="mb-6">
        <div className="grid sm:grid-cols-2 gap-4 font-mono text-xs">
          <ServiceStatusItem label="Frontend Console" value="ONLINE" tone="green" />
          <ServiceStatusItem
            label="FastAPI Backend"
            value={usingLiveBackend ? (health?.fastapi?.toUpperCase() ?? "CHECKING") : "MOCK EMULATOR"}
            tone={usingLiveBackend ? (health?.fastapi === "online" ? "green" : "red") : "amber"}
          />
          <ServiceStatusItem
            label="TigerGraph Cloud"
            value={health?.tigergraph?.toUpperCase() ?? "DISCONNECTED"}
            tone={health?.tigergraph === "connected" ? "green" : "red"}
          />
          <ServiceStatusItem
            label="LangGraph Agent"
            value={health?.agent?.toUpperCase() ?? "OFFLINE"}
            tone={health?.agent === "ready" ? "green" : "amber"}
          />
          <ServiceStatusItem
            label="LLM Provider API"
            value={health?.llm?.toUpperCase() ?? "OFFLINE"}
            tone={health?.llm === "ready" ? "green" : "amber"}
          />
          <ServiceStatusItem
            label="Parquet Dataset"
            value={health?.dataset?.toUpperCase() ?? "MISSING"}
            tone={health?.dataset === "loaded" ? "green" : "amber"}
          />
        </div>
        {health?.timestamp && (
          <div className="mt-4 pt-3 border-t border-white/[.06] font-mono text-[10px] text-dim">
            Last health ping: {new Date(health.timestamp).toLocaleTimeString()}
          </div>
        )}
      </Panel>

      <Panel title="DATA SOURCE & ENVIRONMENT" className="mb-6">
        <div className="flex items-center justify-between font-mono text-sm">
          <span className="text-muted">Active Mode</span>
          <span className={usingLiveBackend ? "text-green font-semibold" : "text-amber font-semibold"}>
            {usingLiveBackend ? "Live Backend (FastAPI)" : "Deterministic Mock Data"}
          </span>
        </div>
        <div className="flex items-center justify-between font-mono text-sm mt-3">
          <span className="text-muted">NEXT_PUBLIC_API_URL</span>
          <span className="text-[#dfe4e8] font-mono text-xs">{API_BASE || "(unset — fallback to mock)"}</span>
        </div>
        <p className="text-xs text-muted mt-4 leading-relaxed">
          To connect Member 2 (LangGraph) and Member 3 (FastAPI/TigerGraph), set{" "}
          <code className="text-[#dfe4e8]">NEXT_PUBLIC_API_URL=http://localhost:8000</code> and{" "}
          <code className="text-[#dfe4e8]">NEXT_PUBLIC_USE_MOCKS=false</code> in{" "}
          <code className="text-[#dfe4e8]">.env.local</code>. No frontend code changes are required.
        </p>
      </Panel>

      <Panel title="ARCHITECTURAL BOUNDARIES">
        <p className="text-xs text-muted leading-relaxed font-sans">
          <strong>Member 1:</strong> Frontend, UX, Sigma.js WebGL Graph, Motion, Mock SSE Stream.<br />
          <strong>Member 2:</strong> LangGraph reasoning, RAG memory retrieval, 5 detectors + undocumented, calibration.<br />
          <strong>Member 3:</strong> FastAPI, Polars lazy queries, TigerGraph Cloud schema, SSE endpoint.
        </p>
      </Panel>
    </div>
  );
}

function ServiceStatusItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "amber" | "red";
}) {
  const dot =
    tone === "green"
      ? "bg-green shadow-[0_0_8px_rgba(59,210,157,0.8)]"
      : tone === "amber"
      ? "bg-amber shadow-[0_0_8px_rgba(254,186,18,0.8)]"
      : "bg-red shadow-[0_0_8px_rgba(255,75,66,0.8)]";

  const textTone =
    tone === "green" ? "text-green" : tone === "amber" ? "text-amber" : "text-red";

  return (
    <div className="flex items-center justify-between p-2.5 rounded border border-white/[.06] bg-white/[.015]">
      <span className="text-dim">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        <span className={`font-semibold ${textTone}`}>{value}</span>
      </div>
    </div>
  );
}
