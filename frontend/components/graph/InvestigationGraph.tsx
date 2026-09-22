"use client";

import { useEffect, useRef, useState } from "react";
import Graph from "graphology";
import circular from "graphology-layout/circular";
import forceAtlas2 from "graphology-layout-forceatlas2";
import Sigma from "sigma";
import type { GraphEdge, GraphNode, InvestigationGraphData } from "@/lib/types";
import { GraphToolbar } from "@/components/workbench/GraphToolbar";
import { GraphLegend } from "@/components/workbench/GraphLegend";

// Node color by type (Design.md #7). Full custom shapes (rounded-rect card,
// diamond device, square case) are a follow-up: sigma node "programs" can
// draw exact shapes, but a color+size encoding ships faster for the demo and
// stays well inside the 200-node / low-GPU budget (Architecture.md #10).
const COLOR_BY_TYPE: Record<GraphNode["type"], string> = {
  customer: "#7d8792",
  card: "#ec6408",
  transaction: "#3e9bd0",
  device: "#ff4b42",
  case: "#ff4b42",
};

export interface InvestigationGraphProps {
  data: InvestigationGraphData;
  onNodeClick?: (node: GraphNode) => void;
  /** node type -> visible. Omit a key to show it. */
  visibleTypes?: Partial<Record<GraphNode["type"], boolean>>;
}

/**
 * WebGL graph rendering via Sigma.js + Graphology (Rules.md stack rule: no
 * Three.js here, cap ~200 nodes — Architecture.md #10). Only ever receives an
 * already-capped investigation subgraph from lib/api.ts; never the full
 * transaction table.
 */
export function InvestigationGraph({ data, onNodeClick, visibleTypes }: InvestigationGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const graph = new Graph();
    data.nodes.forEach((n: GraphNode) => {
      const isFlagged = Boolean(n.flagged);
      graph.addNode(n.id, {
        label: n.label,
        nodeType: n.type,
        flagged: isFlagged,
        risk: n.risk,
        size: isFlagged ? 14 : n.type === "customer" ? 10 : 7,
        color: COLOR_BY_TYPE[n.type],
      });
    });
    data.edges.forEach((e: GraphEdge) => {
      if (graph.hasNode(e.source) && graph.hasNode(e.target) && !graph.hasEdge(e.source, e.target)) {
        graph.addEdge(e.source, e.target, { label: e.label, size: 1 });
      }
    });

    circular.assign(graph);
    forceAtlas2.assign(graph, { iterations: 80, settings: { gravity: 1, scalingRatio: 12 } });

    const sigma = new Sigma(graph, container, {
      renderEdgeLabels: true,
      labelFont: "JetBrains Mono, monospace",
      labelSize: 11,
      labelColor: { color: "#8894a0" },
      edgeLabelSize: 9,
      edgeLabelColor: { color: "#56616c" },
      defaultEdgeColor: "rgba(62,155,208,0.42)",
      minCameraRatio: 0.15,
      maxCameraRatio: 3,
    });

    sigma.on("clickNode", ({ node }) => {
      const meta = data.nodes.find((n) => n.id === node);
      if (meta) onNodeClick?.(meta);
    });

    graphRef.current = graph;
    sigmaRef.current = sigma;
    setReady(true);

    return () => {
      sigma.kill();
      sigmaRef.current = null;
      graphRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Filter by node type without rebuilding the whole graph.
  useEffect(() => {
    const graph = graphRef.current;
    const sigma = sigmaRef.current;
    if (!graph || !sigma || !ready) return;
    graph.forEachNode((node, attrs) => {
      const type = attrs.nodeType as GraphNode["type"];
      const visible = visibleTypes?.[type] !== false;
      graph.setNodeAttribute(node, "hidden", !visible);
    });
    sigma.refresh();
  }, [visibleTypes, ready]);

  const zoom = (factor: number) => sigmaRef.current?.getCamera().animatedZoom({ duration: 250, factor });
  const fit = () => sigmaRef.current?.getCamera().animatedReset({ duration: 300 });

  return (
    <div className="relative w-full h-full min-h-[420px]">
      <div ref={containerRef} className="absolute inset-0 rounded-panel" style={{ background: "#070a0e" }} aria-label="Investigation connected-records graph" role="img" />
      <div className="absolute top-3 right-3 z-10">
        <GraphToolbar onZoomIn={() => zoom(0.7)} onZoomOut={() => zoom(1.3)} onFit={fit} onReset={fit} />
      </div>
      <div className="absolute bottom-3 left-3 z-10 bg-panel/70 backdrop-blur px-2 py-1 rounded">
        <GraphLegend />
      </div>
    </div>
  );
}
