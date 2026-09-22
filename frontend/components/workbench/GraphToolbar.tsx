"use client";

import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from "lucide-react";

export function GraphToolbar({ onZoomIn, onZoomOut, onFit, onReset }: { onZoomIn: () => void; onZoomOut: () => void; onFit: () => void; onReset: () => void }) {
  const btn = "p-1.5 rounded border border-white/10 text-muted hover:text-white hover:border-white/30 transition-colors";
  return (
    <div className="flex items-center gap-1.5" role="toolbar" aria-label="Graph controls">
      <button className={btn} onClick={onZoomIn} aria-label="Zoom in">
        <ZoomIn size={14} />
      </button>
      <button className={btn} onClick={onZoomOut} aria-label="Zoom out">
        <ZoomOut size={14} />
      </button>
      <button className={btn} onClick={onFit} aria-label="Fit graph to view">
        <Maximize2 size={14} />
      </button>
      <button className={btn} onClick={onReset} aria-label="Reset view">
        <RotateCcw size={14} />
      </button>
    </div>
  );
}
