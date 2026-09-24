"use client";

import { useEffect, useState } from "react";
import { getHealth } from "@/lib/api";

export type GraphConnectionState = "CONNECTED" | "CONNECTING" | "OFFLINE" | "ERROR";

export interface GraphStatusInfo {
  state: GraphConnectionState;
  label: string;
  tone: "green" | "amber" | "cyan" | "red";
  isLive: boolean;
  graphMode: string;
}

let cachedStatus: GraphStatusInfo = {
  state: "CONNECTING",
  label: "GRAPH CONNECTING",
  tone: "cyan",
  isLive: false,
  graphMode: "INITIALIZING",
};

const listeners = new Set<(status: GraphStatusInfo) => void>();

function notify(newStatus: GraphStatusInfo) {
  cachedStatus = newStatus;
  listeners.forEach((l) => l(newStatus));
}

let pollingStarted = false;

async function checkHealth() {
  try {
    const h = await getHealth();
    const isConnected = h.tigergraph === "connected";
    const newState: GraphStatusInfo = isConnected
      ? {
          state: "CONNECTED",
          label: "GRAPH CONNECTED",
          tone: "green",
          isLive: true,
          graphMode: h.graph_mode || "LIVE",
        }
      : {
          state: "OFFLINE",
          label: "GRAPH OFFLINE (DATASET)",
          tone: "amber",
          isLive: false,
          graphMode: h.graph_mode || "DATASET_FALLBACK",
        };
    notify(newState);
  } catch {
    notify({
      state: "ERROR",
      label: "GRAPH ERROR",
      tone: "red",
      isLive: false,
      graphMode: "UNAVAILABLE",
    });
  }
}

export function useGraphStatus(): GraphStatusInfo {
  const [status, setStatus] = useState<GraphStatusInfo>(cachedStatus);

  useEffect(() => {
    listeners.add(setStatus);
    if (!pollingStarted) {
      pollingStarted = true;
      checkHealth();
      const interval = setInterval(checkHealth, 15000);
      return () => {
        clearInterval(interval);
        listeners.delete(setStatus);
      };
    }
    return () => {
      listeners.delete(setStatus);
    };
  }, []);

  return status;
}
