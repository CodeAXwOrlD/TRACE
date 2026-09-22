import { cn } from "@/lib/utils";

export function Panel({ title, children, className, accent }: { title?: string; children: React.ReactNode; className?: string; accent?: "orange" | "blue" | "red" | "green" | "amber" }) {
  const accentColor: Record<string, string> = { orange: "before:bg-orange", blue: "before:bg-blue", red: "before:bg-red", green: "before:bg-green", amber: "before:bg-amber" };
  return (
    <section
      className={cn(
        "relative rounded-panel border border-white/[.08] bg-white/[.015] p-6 overflow-hidden",
        accent && "before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px]",
        accent && accentColor[accent],
        className
      )}
    >
      {title && <div className="font-mono text-[10.5px] tracking-wider text-[#aab3bc] mb-4">{title}</div>}
      {children}
    </section>
  );
}
