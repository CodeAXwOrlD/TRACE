import type { GraphNode } from "@/lib/types";

export interface NodeDetailsProps {
  node: GraphNode;
  onClose: () => void;
}

/**
 * Contextual information panel opened when clicking any graph node
 * (project prompt section 9). Purely data-driven from the node's attributes
 * and node.meta — no direct mock imports.
 */
export function NodeDetails({ node, onClose }: NodeDetailsProps) {
  const metaEntries = node.meta ? Object.entries(node.meta) : [];

  return (
    <div className="rounded-panel border border-white/[.08] bg-panel-soft p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-wider text-blue font-semibold uppercase">
            {node.type}
          </span>
          {node.flagged && (
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-orange/20 text-orange border border-orange/40">
              FLAGGED
            </span>
          )}
          {node.risk && (
            <span
              className={`font-mono text-[9px] px-1.5 py-0.5 rounded border uppercase ${
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
          className="text-dim hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-white/[.05] transition-colors"
          aria-label="Close node details"
        >
          ✕
        </button>
      </div>

      <div className="text-base font-semibold font-mono text-[#f4f6f8] mb-3">
        {node.label}
      </div>

      {metaEntries.length > 0 ? (
        <dl className="space-y-1.5 font-mono text-xs">
          {metaEntries.map(([key, val]) => (
            <div key={key} className="flex justify-between items-center py-0.5 border-b border-white/[.04] last:border-0">
              <dt className="text-dim capitalize">{key.replace(/([A-Z])/g, " $1").toLowerCase()}</dt>
              <dd className="text-[#dfe4e8] font-medium">{String(val)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="text-muted text-xs font-mono">
          Entity ID: {node.id}
          <br />
          Relationship: Connected in investigation subgraph
        </div>
      )}
    </div>
  );
}
