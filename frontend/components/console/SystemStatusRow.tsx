"use client";

import { useEffect, useState } from "react";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { getHealth } from "@/lib/api";
import type { HealthStatusContract } from "@/lib/contracts";

export function SystemStatusRow() {
  const [health, setHealth] = useState<HealthStatusContract | null>(null);

  useEffect(() => {
    getHealth().then(setHealth).catch(() => {
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
    });
  }, []);

  const isGraphOk = health?.tigergraph === "connected";
  const isAgentOk = health?.agent === "ready";
  const isSystemOk = health?.status === "ok";

  return (
    <div className="flex flex-wrap gap-6 mb-8">
      <StatusIndicator
        label={isSystemOk ? "SYSTEM ONLINE" : "SYSTEM DEGRADED"}
        tone={isSystemOk ? "green" : "amber"}
      />
      <StatusIndicator
        label={isGraphOk ? "GRAPH CONNECTED" : "GRAPH DISCONNECTED"}
        tone={isGraphOk ? "green" : "red"}
      />
      <StatusIndicator
        label={isAgentOk ? "AGENT READY" : "AGENT OFFLINE"}
        tone={isAgentOk ? "green" : "amber"}
      />
    </div>
  );
}
