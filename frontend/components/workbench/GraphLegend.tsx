const items: { label: string; shape: string; color: string }[] = [
  { label: "Customer", shape: "●", color: "#7d8792" },
  { label: "Card", shape: "▭", color: "#ec6408" },
  { label: "Transaction", shape: "●", color: "#3e9bd0" },
  { label: "Flagged txn", shape: "●", color: "#ec6408" },
  { label: "Device", shape: "◆", color: "#ff4b42" },
  { label: "Closed case", shape: "▪", color: "#ff4b42" },
];

/** Node shapes/colors per Design.md #7 "Connected-records graph". */
export function GraphLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-muted">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5">
          <span style={{ color: it.color }}>{it.shape}</span>
          {it.label}
        </span>
      ))}
    </div>
  );
}
