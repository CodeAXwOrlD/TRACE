import { cn } from "@/lib/utils";

export function Badge({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: "neutral" | "fraud" | "legit" | "unsure"; className?: string }) {
  const colors: Record<string, string> = {
    neutral: "text-muted border-white/20",
    fraud: "text-red border-red",
    legit: "text-green border-green",
    unsure: "text-amber border-amber",
  };
  return (
    <span className={cn("inline-block font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded-full border", colors[tone], className)}>
      {children}
    </span>
  );
}
