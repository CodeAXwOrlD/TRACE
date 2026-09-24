"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Graph from "graphology";
import circular from "graphology-layout/circular";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw, ShieldAlert, CreditCard, User, Smartphone, FileText, Layers, RefreshCw } from "lucide-react";
import type { GraphEdge, GraphNode, InvestigationGraphData } from "@/lib/types";

// ============================================================================
// TigerGraph Savanna Canonical Theme & Color Palette
// Directly matching TigerGraph GraphStudio FraudCaseGraph UI
// ============================================================================
export const TIGERGRAPH_THEME = {
  customer: {
    fill: "#10b981", // Emerald Green
    border: "#6ee7b7",
    glow: "rgba(16, 185, 129, 0.45)",
    label: "Customer",
    shortLabel: "CUST",
    badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    icon: User,
  },
  card: {
    fill: "#ef4444", // Vivid Crimson Red (matching Savanna Card vertex)
    border: "#fca5a5",
    glow: "rgba(239, 68, 68, 0.45)",
    label: "Card",
    shortLabel: "CARD",
    badge: "bg-red-500/20 text-red-400 border-red-500/40",
    icon: CreditCard,
  },
  transaction: {
    fill: "#f59e0b", // Electric Orange / Amber (matching Savanna Transaction)
    border: "#fcd34d",
    glow: "rgba(245, 158, 11, 0.5)",
    label: "Transaction",
    shortLabel: "TXN",
    badge: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    icon: ShieldAlert,
  },
  device: {
    fill: "#8b5cf6", // Electric Violet / Purple (matching Savanna Identity/Device)
    border: "#c4b5fd",
    glow: "rgba(139, 92, 246, 0.45)",
    label: "Device",
    shortLabel: "DEV",
    badge: "bg-purple-500/20 text-purple-400 border-purple-500/40",
    icon: Smartphone,
  },
  case: {
    fill: "#3b82f6", // Royal Azure Blue (matching Savanna CaseRecord)
    border: "#93c5fd",
    glow: "rgba(59, 130, 246, 0.45)",
    label: "CaseRecord",
    shortLabel: "CASE",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/40",
    icon: FileText,
  },
};

interface NodePosition {
  x: number;
  y: number;
}

export interface InvestigationGraphProps {
  data: InvestigationGraphData;
  onNodeClick?: (node: GraphNode) => void;
  visibleTypes?: Partial<Record<GraphNode["type"], boolean>>;
}

/**
 * High-performance TigerGraph GraphStudio Canvas.
 * Built with interactive SVG + Graphology Force-Atlas layout.
 * Features:
 * - Direct visual match to TigerGraph Savanna FraudCaseGraph UI
 * - Interactive node dragging with real-time dynamic edge updates
 * - Smooth mouse-wheel zoom & canvas drag-to-pan
 * - Glowing vertex halos, directional edge arrows & edge pill badges
 * - Click-to-inspect properties drawer
 * - 100% crash-free: zero WebGL / GPU-driver failure points
 */
export function InvestigationGraph({ data, onNodeClick, visibleTypes }: InvestigationGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Canvas Viewport Transform (Pan & Zoom)
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Interactive Node Dragging State
  const [positions, setPositions] = useState<Record<string, NodePosition>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Selection & Hover States
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hiddenTypes, setHiddenTypes] = useState<Record<string, boolean>>({});

  // Fullscreen expand/collapse state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Close fullscreen on Escape key & lock document scrolling
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFullscreen]);

  useEffect(() => {
    if (isFullscreen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isFullscreen]);

  // Compute organic coordinates using Graphology ForceAtlas2 on mount/data change
  const computeInitialLayout = useCallback(() => {
    if (!data.nodes || data.nodes.length === 0) return;

    try {
      const g = new Graph();
      data.nodes.forEach((n) => g.addNode(n.id));
      data.edges.forEach((e) => {
        if (g.hasNode(e.source) && g.hasNode(e.target) && !g.hasEdge(e.source, e.target)) {
          g.addEdge(e.source, e.target);
        }
      });

      // Initial circular layout followed by ForceAtlas2 spring relaxation
      circular.assign(g);
      forceAtlas2.assign(g, {
        iterations: 120,
        settings: {
          gravity: 1.2,
          scalingRatio: 25,
          barnesHutOptimize: true,
          strongGravityMode: false,
        },
      });

      // Find bounding box
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;

      g.forEachNode((_, attrs) => {
        if (attrs.x < minX) minX = attrs.x;
        if (attrs.x > maxX) maxX = attrs.x;
        if (attrs.y < minY) minY = attrs.y;
        if (attrs.y > maxY) maxY = attrs.y;
      });

      const spanX = Math.max(maxX - minX, 1);
      const spanY = Math.max(maxY - minY, 1);
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      // Map to 880x520 viewport with padding
      const targetWidth = 720;
      const targetHeight = 400;
      const scale = Math.min(targetWidth / spanX, targetHeight / spanY, 12);

      const computed: Record<string, NodePosition> = {};
      g.forEachNode((id, attrs) => {
        computed[id] = {
          x: 440 + (attrs.x - centerX) * scale,
          y: 260 + (attrs.y - centerY) * scale,
        };
      });

      setPositions(computed);
    } catch {
      // Deterministic radial fallback if force simulation fails
      const fallback: Record<string, NodePosition> = {};
      const total = data.nodes.length;
      data.nodes.forEach((n, idx) => {
        if (n.flagged) {
          fallback[n.id] = { x: 440, y: 260 };
        } else {
          const angle = (idx / (total - 1 || 1)) * 2 * Math.PI;
          const radius = idx % 2 === 0 ? 190 : 250;
          fallback[n.id] = {
            x: 440 + Math.cos(angle) * radius,
            y: 260 + Math.sin(angle) * radius,
          };
        }
      });
      setPositions(fallback);
    }
  }, [data]);

  useEffect(() => {
    computeInitialLayout();
  }, [computeInitialLayout]);

  // Node Map for fast lookup
  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    data.nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [data.nodes]);

  // Filtered nodes & edges based on hidden types
  const visibleNodes = useMemo(() => {
    return data.nodes.filter((n) => !hiddenTypes[n.type]);
  }, [data.nodes, hiddenTypes]);

  const visibleEdges = useMemo(() => {
    const visibleIds = new Set(visibleNodes.map((n) => n.id));
    return data.edges.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target));
  }, [data.edges, visibleNodes]);

  // Connected node IDs for highlighted selection
  const connectedNodeIds = useMemo(() => {
    if (!selectedNodeId && !hoveredNodeId) return null;
    const target = selectedNodeId || hoveredNodeId;
    const connected = new Set<string>([target!]);
    data.edges.forEach((e) => {
      if (e.source === target) connected.add(e.target);
      if (e.target === target) connected.add(e.source);
    });
    return connected;
  }, [selectedNodeId, hoveredNodeId, data.edges]);

  // Pan handlers
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if (e.button !== 0 || draggingId) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
    } else if (draggingId) {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const clientX = (e.clientX - containerRect.left - transform.x) / transform.k;
      const clientY = (e.clientY - containerRect.top - transform.y) / transform.k;

      setPositions((prev) => ({
        ...prev,
        [draggingId]: {
          x: clientX - dragOffset.x,
          y: clientY - dragOffset.y,
        },
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingId(null);
  };

  // Isolate wheel zoom so scrolling over the graph canvas does NOT scroll the browser page
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
      setTransform((prev) => {
        const newK = Math.max(0.35, Math.min(3.5, prev.k * zoomFactor));
        return { ...prev, k: newK };
      });
    };
    el.addEventListener("wheel", wheelHandler, { passive: false });
    return () => el.removeEventListener("wheel", wheelHandler);
  }, []);

  // Node Drag Initiator
  const startDragNode = (e: React.MouseEvent, node: GraphNode) => {
    e.stopPropagation();
    const pos = positions[node.id] || { x: 440, y: 260 };
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const mouseCanvasX = (e.clientX - containerRect.left - transform.x) / transform.k;
    const mouseCanvasY = (e.clientY - containerRect.top - transform.y) / transform.k;

    setDraggingId(node.id);
    setDragOffset({
      x: mouseCanvasX - pos.x,
      y: mouseCanvasY - pos.y,
    });

    setSelectedNodeId(node.id);
    onNodeClick?.(node);
  };

  // Toolbar Actions
  const zoomIn = () => setTransform((p) => ({ ...p, k: Math.min(3.5, p.k * 1.25) }));
  const zoomOut = () => setTransform((p) => ({ ...p, k: Math.max(0.4, p.k * 0.8) }));
  const resetView = () => setTransform({ x: 0, y: 0, k: 1 });

  const toggleTypeVisibility = (type: string) => {
    setHiddenTypes((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  // Type Counts
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    data.nodes.forEach((n) => {
      counts[n.type] = (counts[n.type] || 0) + 1;
    });
    return counts;
  }, [data.nodes]);

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden bg-[#070a0f] shadow-2xl transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-0 z-[9999] rounded-none border-0 w-screen h-screen"
          : "w-full h-full min-h-[540px] rounded-xl border border-white/[.12]"
      }`}
      onMouseDown={handleMouseDownCanvas}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Left: TigerGraph Savanna Brand Watermark & Schema Title */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 pointer-events-none select-none">
        <div className="flex items-center gap-2 bg-[#0a0e13]/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/[.08] shadow-lg">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-sans text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
            <span className="text-orange">FraudCaseGraph</span>
            <span className="text-white/30">•</span>
            <span className="text-emerald-400 font-medium">TigerGraph Savanna GSQL</span>
          </span>
        </div>
        <div className="font-sans text-[11px] text-[#8894a0] flex items-center gap-2 px-1">
          <span>{visibleNodes.length} Vertices rendered</span>
          <span>•</span>
          <span>{visibleEdges.length} Graph Relationships</span>
          <span>•</span>
          <span className="text-blue font-medium">Multi-Hop Traversal</span>
        </div>
      </div>

      {/* Top Right: Graph Controls Toolbar */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-[#0a0e13]/90 backdrop-blur-md p-1.5 rounded-xl border border-white/[.08] shadow-xl">
        <button
          onClick={zoomIn}
          title="Zoom In"
          className="p-1.5 rounded-lg hover:bg-white/[.08] text-[#8894a0] hover:text-white transition-colors"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={zoomOut}
          title="Zoom Out"
          className="p-1.5 rounded-lg hover:bg-white/[.08] text-[#8894a0] hover:text-white transition-colors"
        >
          <ZoomOut size={16} />
        </button>
        <div className="w-[1px] h-4 bg-white/10 my-auto mx-0.5" />
        <button
          onClick={resetView}
          title="Reset Camera & Center"
          className="p-1.5 rounded-lg hover:bg-white/[.08] text-[#8894a0] hover:text-white transition-colors"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={() => setIsFullscreen((v) => !v)}
          title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen Graph"}
          className="p-1.5 rounded-lg hover:bg-white/[.08] text-[#8894a0] hover:text-orange transition-colors"
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        <button
          onClick={computeInitialLayout}
          title="Re-run Force-Atlas Layout"
          className="p-1.5 rounded-lg hover:bg-white/[.08] text-[#8894a0] hover:text-orange transition-colors"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* The Master SVG Graph Canvas */}
      <svg
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ width: "100%", height: "100%" }}
      >
        <defs>
          {/* Dot Matrix Background Pattern */}
          <pattern id="tg-blueprint-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#334155" opacity="0.3" />
          </pattern>

          {/* Directional Edge Arrowhead Marker */}
          <marker
            id="edge-arrow"
            viewBox="0 0 10 10"
            refX="26"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b" />
          </marker>

          {/* Active Highlight Arrowhead Marker */}
          <marker
            id="edge-arrow-active"
            viewBox="0 0 10 10"
            refX="26"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
          </marker>

          {/* High-Risk Halo Pulse Filter */}
          <filter id="halo-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Blueprint Grid Background */}
        <rect width="100%" height="100%" fill="url(#tg-blueprint-grid)" />

        {/* Zoomed & Panned Group */}
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          {/* ============================================================== */}
          {/* 1. EDGES & RELATIONSHIP PILL LABELS                            */}
          {/* ============================================================== */}
          {visibleEdges.map((e) => {
            const src = positions[e.source];
            const dst = positions[e.target];
            if (!src || !dst) return null;

            const isEdgeActive =
              connectedNodeIds &&
              connectedNodeIds.has(e.source) &&
              connectedNodeIds.has(e.target);

            const isDimmed = connectedNodeIds && !isEdgeActive;

            // Compute midpoint and perpendicular offset for smooth curve
            const midX = (src.x + dst.x) / 2;
            const midY = (src.y + dst.y) / 2;
            const dx = dst.x - src.x;
            const dy = dst.y - src.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const curveOffset = Math.min(22, dist * 0.08);
            const cx = midX - (dy / dist) * curveOffset;
            const cy = midY + (dx / dist) * curveOffset;

            const pathD = `M ${src.x} ${src.y} Q ${cx} ${cy} ${dst.x} ${dst.y}`;

            return (
              <g
                key={e.id || `${e.source}-${e.target}`}
                className={`transition-opacity duration-300 ${isDimmed ? "opacity-20" : "opacity-90"}`}
              >
                {/* Background Line Glow */}
                {isEdgeActive && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="4"
                    strokeOpacity="0.4"
                    filter="url(#halo-glow)"
                  />
                )}

                {/* Primary Edge Path */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={isEdgeActive ? "#38bdf8" : "#475569"}
                  strokeWidth={isEdgeActive ? 2.5 : 1.75}
                  strokeDasharray={e.label?.includes("SIMILAR") ? "5 3" : undefined}
                  markerEnd={isEdgeActive ? "url(#edge-arrow-active)" : "url(#edge-arrow)"}
                />

                {/* Relationship Pill Badge */}
                {e.label && (
                  <g transform={`translate(${cx}, ${cy})`}>
                    <rect
                      x={-(e.label.length * 3.8 + 12)}
                      y="-10"
                      width={e.label.length * 7.6 + 24}
                      height="20"
                      rx="10"
                      fill="#0b0f17"
                      stroke={isEdgeActive ? "#38bdf8" : "#334155"}
                      strokeWidth="1.2"
                    />
                    <text
                      textAnchor="middle"
                      dy="3.5"
                      fill={isEdgeActive ? "#e0f2fe" : "#94a3b8"}
                      fontSize="9"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="600"
                      letterSpacing="0.05em"
                    >
                      {e.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* ============================================================== */}
          {/* 2. VERTEX NODES (TigerGraph Savanna Aesthetic - Symmetric)     */}
          {/* ============================================================== */}
          {visibleNodes.map((n) => {
            const pos = positions[n.id];
            if (!pos) return null;

            const theme = TIGERGRAPH_THEME[n.type] || TIGERGRAPH_THEME.transaction;
            const isSelected = selectedNodeId === n.id;
            const isHovered = hoveredNodeId === n.id;
            const isFlagged = Boolean(n.flagged);

            const isDimmed = connectedNodeIds && !connectedNodeIds.has(n.id);
            // Symmetrical uniform radii: 40px for trigger transaction, 34px for regular nodes
            const radius = isFlagged ? 40 : 34;

            const rawLabel = n.label || n.id || "";
            const displayLabel = rawLabel.length > 8 ? rawLabel.slice(0, 7) + "…" : rawLabel;

            return (
              <g
                key={n.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className={`cursor-pointer transition-opacity duration-200 ${isDimmed ? "opacity-25" : "opacity-100"}`}
                onMouseDown={(e) => startDragNode(e, n)}
                onMouseEnter={() => setHoveredNodeId(n.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
              >
                {/* Native Browser Tooltip with full untruncated info */}
                <title>{`${theme.label}: ${rawLabel}${n.risk ? ` • ${n.risk.toUpperCase()} Risk` : ""}`}</title>

                {/* Flagged Pulsating Neon Ring */}
                {isFlagged && (
                  <>
                    <circle
                      r={radius + 12}
                      fill="none"
                      stroke="#ec6408"
                      strokeWidth="2"
                      opacity="0.4"
                      className="animate-ping"
                    />
                    <circle
                      r={radius + 6}
                      fill="none"
                      stroke="#ec6408"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      opacity="0.8"
                    />
                  </>
                )}

                {/* Selected/Hovered Outer Glow Halo */}
                {(isSelected || isHovered) && (
                  <circle
                    r={radius + 6}
                    fill="none"
                    stroke={theme.border}
                    strokeWidth="3"
                    filter="url(#halo-glow)"
                    opacity="0.9"
                  />
                )}

                {/* Main Node Body (Solid Vibrant Symmetrical Circle with Border) */}
                <circle
                  r={radius}
                  fill={theme.fill}
                  stroke={theme.border}
                  strokeWidth={isSelected ? 3.5 : 2}
                  style={{ filter: `drop-shadow(0 0 14px ${theme.glow})` }}
                />

                {/* Vertex Type Header Text inside Node */}
                <text
                  textAnchor="middle"
                  y={-10}
                  fill="rgba(255, 255, 255, 0.85)"
                  fontSize="8"
                  fontFamily="var(--sans), Plus Jakarta Sans, system-ui, sans-serif"
                  fontWeight="700"
                  letterSpacing="0.08em"
                >
                  {(theme.shortLabel || theme.label).toUpperCase()}
                </text>

                {/* Main Value / ID Label inside Node */}
                <text
                  textAnchor="middle"
                  y={7}
                  dominantBaseline="central"
                  fill="#ffffff"
                  fontSize={isFlagged ? "12" : "11"}
                  fontFamily="var(--sans), Plus Jakarta Sans, system-ui, sans-serif"
                  fontWeight="800"
                >
                  {displayLabel}
                </text>

                {/* Sleek Risk Pip at bottom if present */}
                {n.risk && (
                  <circle
                    cx="0"
                    cy={radius - 9}
                    r="3.5"
                    fill={n.risk === "high" ? "#ff4b42" : n.risk === "medium" ? "#feba12" : "#3bd29d"}
                    stroke="#070a0f"
                    strokeWidth="1.5"
                  />
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* ============================================================== */}
      {/* 3. BOTTOM FILTER LEGEND (TigerGraph Vertex Categories)          */}
      {/* ============================================================== */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-[#0a0e13]/90 backdrop-blur-md px-3 py-2 rounded-xl border border-white/[.08] shadow-xl">
        <span className="font-sans text-[11px] font-semibold text-[#8894a0] mr-1 flex items-center gap-1.5">
          <Layers size={13} className="text-orange" />
          Filter:
        </span>
        {(Object.keys(TIGERGRAPH_THEME) as Array<keyof typeof TIGERGRAPH_THEME>).map((type) => {
          const cfg = TIGERGRAPH_THEME[type];
          const isHidden = hiddenTypes[type];
          const count = typeCounts[type] || 0;
          if (count === 0) return null;

          return (
            <button
              key={type}
              onClick={() => toggleTypeVisibility(type)}
              className={`flex items-center gap-1.5 font-sans text-xs font-semibold px-2.5 py-1 rounded-lg transition-all border ${
                isHidden
                  ? "bg-white/[.02] text-[#56616c] border-white/5 opacity-50 line-through"
                  : `${cfg.badge} hover:brightness-125 shadow-sm`
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: isHidden ? "#555" : cfg.fill }}
              />
              <span>{cfg.label}</span>
              <span className="opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Hint text at bottom right */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-none hidden sm:block">
        <span className="font-sans text-[11px] text-[#8894a0] bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/5">
          Drag nodes • Scroll to zoom • Click to inspect
        </span>
      </div>
    </div>
  );
}
