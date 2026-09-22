export function Metric({ label, value, tone }: { label: string; value: string | number; tone?: "red" | "green" | "amber" }) {
  const color = tone === "red" ? "text-red" : tone === "green" ? "text-green" : tone === "amber" ? "text-amber" : "text-ink";
  return (
    <div className="rounded-panel border border-white/[.08] bg-white/[.015] p-5">
      <div className="font-mono text-[10px] tracking-wider text-muted mb-2">{label.toUpperCase()}</div>
      <div className={`text-3xl font-bold tracking-tight ${color}`}>{value}</div>
    </div>
  );
}
