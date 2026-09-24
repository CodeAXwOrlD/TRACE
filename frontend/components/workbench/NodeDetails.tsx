"use client";

import type { GraphNode } from "@/lib/types";
import { User, CreditCard, ShieldAlert, Smartphone, FileText, Globe, ArrowRight } from "lucide-react";

export interface NodeDetailsProps {
  node: GraphNode | null;
  onClose: () => void;
  onFocusNode?: (nodeId: string) => void;
}

export function NodeDetails({ node, onClose, onFocusNode }: NodeDetailsProps) {
  if (!node) {
    return (
      <div className="h-full rounded-xl border border-white/[.08] bg-[#0c1017] p-5 shadow-xl flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
          <Globe size={20} />
        </div>
        <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider mb-1">
          Vertex & Edge Inspector
        </h3>
        <p className="text-xs text-muted max-w-[260px] leading-relaxed">
          Click any vertex or edge in the TigerGraph canvas to inspect its schema attributes, connection path, and relational signals.
        </p>
      </div>
    );
  }

  const metaEntries = node.meta ? Object.entries(node.meta) : [];

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "customer":
        return <User size={15} className="text-emerald-400" />;
      case "card":
        return <CreditCard size={15} className="text-rose-400" />;
      case "transaction":
        return <ShieldAlert size={15} className="text-orange" />;
      case "device":
        return <Smartphone size={15} className="text-purple-400" />;
      case "case":
        return <FileText size={15} className="text-blue" />;
      default:
        return <Globe size={15} className="text-muted" />;
    }
  };

  const getWhyConnected = () => {
    switch (node.type) {
      case "transaction":
        return node.flagged
          ? "Primary flagged trigger transaction that initiated the investigation workflow."
          : "Historical transaction associated with this cardholder's velocity window.";
      case "card":
        return "Payment instrument utilized for the flagged authorization attempt.";
      case "customer":
        return "Cardholder entity linked to payment cards and historical account profile.";
      case "device":
        return "Client device fingerprint / browser observed during authorization.";
      case "case":
        return "Historical closed case retrieved from 5,565-case memory for similarity matching.";
      default:
        return "Connected in the multi-hop graph investigation neighborhood.";
    }
  };

  return (
    <div className="rounded-xl border border-white/[.1] bg-[#0c1017] p-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[.08]">
        <div className="flex items-center gap-2">
          {getNodeIcon(node.type)}
          <span className="font-mono text-xs font-bold tracking-wider text-white uppercase">
            {node.type} INSPECTOR
          </span>
          {node.flagged && (
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-orange/20 text-orange border border-orange/40 font-bold">
              TRIGGER
            </span>
          )}
          {node.risk && (
            <span
              className={`font-mono text-[9px] px-1.5 py-0.5 rounded border uppercase font-semibold ${
                node.risk === "high"
                  ? "text-red border-red/40 bg-red/10"
                  : node.risk === "medium"
                  ? "text-amber border-amber/40 bg-amber/10"
                  : "text-green border-green/40 bg-green/10"
              }`}
            >
              {node.risk} signal
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-dim hover:text-white text-xs px-2 py-1 rounded bg-white/[.04] hover:bg-white/[.08] transition-colors"
          aria-label="Close node details"
        >
          ✕
        </button>
      </div>

      {/* Main Node Label & Entity ID */}
      <div className="mb-3">
        <div className="text-base font-extrabold font-mono text-white">
          {node.label}
        </div>
        <div className="font-mono text-[10px] text-muted">
          Vertex ID: <span className="text-[#dfe4e8]">{node.id}</span>
        </div>
      </div>

      {/* Why This Node Is Connected */}
      <div className="p-2.5 rounded-lg bg-black/40 border border-white/[.06] mb-3">
        <span className="font-mono text-[10px] text-orange block mb-1 uppercase tracking-wider font-semibold">
          Why Connected:
        </span>
        <p className="text-xs text-[#cbd5e1] font-sans leading-relaxed">
          {getWhyConnected()}
        </p>
      </div>

      {/* Attributes Table */}
      {metaEntries.length > 0 && (
        <div className="mb-3">
          <span className="font-mono text-[10px] text-muted block mb-1.5 uppercase tracking-wider">
            Entity Attributes:
          </span>
          <dl className="space-y-1 font-mono text-xs bg-white/[.02] p-2.5 rounded-lg border border-white/[.04]">
            {metaEntries.map(([key, val]) => (
              <div
                key={key}
                className="flex justify-between items-center py-1 border-b border-white/[.04] last:border-0"
              >
                <dt className="text-dim capitalize">
                  {key.replace(/([A-Z])/g, " $1").toLowerCase()}:
                </dt>
                <dd className="text-[#dfe4e8] font-medium truncate max-w-[200px]" title={String(val)}>
                  {String(val)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Node Focus Action */}
      {onFocusNode && (
        <div className="pt-2 border-t border-white/[.06] flex justify-end">
          <button
            onClick={() => onFocusNode(node.id)}
            className="inline-flex items-center gap-1 font-mono text-[11px] text-orange hover:text-white transition-colors"
          >
            <span>Center Node in View</span>
            <ArrowRight size={11} />
          </button>
        </div>
      )}
    </div>
  );
}
