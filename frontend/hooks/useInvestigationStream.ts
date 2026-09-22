"use client";

import { useEffect, useRef, useState } from "react";
import type { AgentEvent } from "@/lib/types";
import { subscribeToStream } from "@/lib/sse";

export interface InvestigationStreamState {
  events: AgentEvent[];
  isComplete: boolean;
  isRunning: boolean;
  reset: () => void;
}

/**
 * Subscribes to an investigation's agent-activity stream (mock today, real
 * SSE once Member 2/3 wire it up — see lib/sse.ts). Component API never
 * changes between the two modes.
 */
export function useInvestigationStream(investigationId: string | null): InvestigationStreamState {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const generation = useRef(0);

  useEffect(() => {
    if (!investigationId) return;
    const myGeneration = ++generation.current;
    setEvents([]);
    setIsComplete(false);
    setIsRunning(true);

    const handle = subscribeToStream(
      investigationId,
      (event) => {
        if (generation.current !== myGeneration) return;
        setEvents((prev) => [...prev, event]);
      },
      () => {
        if (generation.current !== myGeneration) return;
        setIsComplete(true);
        setIsRunning(false);
      }
    );

    return () => handle.close();
  }, [investigationId]);

  return {
    events,
    isComplete,
    isRunning,
    reset: () => {
      generation.current++;
      setEvents([]);
      setIsComplete(false);
      setIsRunning(false);
    },
  };
}
