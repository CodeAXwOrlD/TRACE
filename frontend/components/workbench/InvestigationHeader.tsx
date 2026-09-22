import type { Investigation } from "@/lib/types";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { formatTimestamp } from "@/lib/utils";

export function InvestigationHeader({ investigation }: { investigation: Investigation }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[.08]">
      <div>
        <div className="font-mono text-[11px] tracking-wider text-blue mb-1">INVESTIGATION</div>
        <h1 className="text-2xl font-bold tracking-tight">{investigation.caseId}</h1>
        <div className="text-muted text-sm mt-1">
          Customer {investigation.customerId} · Opened {formatTimestamp(investigation.createdAt)}
        </div>
      </div>
      <RiskBadge verdict={investigation.risk.verdict} />
    </div>
  );
}
