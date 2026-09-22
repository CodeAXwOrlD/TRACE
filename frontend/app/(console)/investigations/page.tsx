import Link from "next/link";
import { getInvestigations } from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { StartInvestigationCard } from "@/components/workbench/StartInvestigationCard";
import { formatTimestamp } from "@/lib/utils";
import type { Investigation } from "@/lib/types";

export default async function InvestigationsPage() {
  const investigations = await getInvestigations();

  return (
    <div>
      <div className="mb-6">
        <div className="font-mono text-[11px] tracking-wider text-blue mb-1">INVESTIGATIONS</div>
        <h1 className="text-2xl font-bold tracking-tight">Investigation Console</h1>
      </div>

      <StartInvestigationCard />
      <div className="rounded-panel border border-white/[.08] bg-white/[.015] p-4">
        <DataTable<Investigation>
          columns={[
            { header: "Case", render: (r) => <Link href={`/investigations/${r.id}`} className="font-mono text-[#dfe4e8] hover:text-white">{r.caseId}</Link> },
            { header: "Customer", render: (r) => r.customerId },
            { header: "Pattern", render: (r) => r.pattern ?? "—" },
            { header: "Opened", render: (r) => formatTimestamp(r.createdAt) },
            { header: "Verdict", render: (r) => <RiskBadge verdict={r.risk.verdict} /> },
          ]}
          rows={investigations}
        />
      </div>
    </div>
  );
}
