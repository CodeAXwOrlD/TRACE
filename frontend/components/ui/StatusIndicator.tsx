import { cn } from "@/lib/utils";

export function StatusIndicator({ label, tone = "green", pulse = true }: { label: string; tone?: "green" | "amber" | "red"; pulse?: boolean }) {
  const dot: Record<string, string> = { green: "bg-green shadow-[0_0_9px_rgba(59,210,157,.7)]", amber: "bg-amber", red: "bg-red" };
  return (
    <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-muted">
      <span className={cn("w-1.5 h-1.5 rounded-full", dot[tone], pulse && "animate-pulse")} aria-hidden="true" />
      {label}
    </div>
  );
}
