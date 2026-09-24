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
      <div className="rounded-panel border border-white/[.12] bg-[#080c10]/80 backdrop-blur-md p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[.06]">
          <h3 className="font-semibold text-sm text-white">Active Queue & Benchmark Cases</h3>
          <span className="text-[11px] font-mono text-muted">Click any case or button to open live workspace</span>
        </div>
        <DataTable<Investigation>
          columns={[
            { header: "Case", render: (r) => <Link href={`/investigations/${r.id}`} className="font-mono text-white font-medium hover:text-orange transition-colors">{r.caseId}</Link> },
            { header: "Customer", render: (r) => <span className="font-mono text-xs text-muted">{r.customerId}</span> },
            { header: "Pattern", render: (r) => <span className="font-mono text-xs text-[#dfe4e8]">{r.pattern ?? "—"}</span> },
            { header: "Opened", render: (r) => <span className="text-xs text-muted">{formatTimestamp(r.createdAt)}</span> },
            { header: "Verdict", render: (r) => <RiskBadge verdict={r.risk?.verdict} /> },
            {
              header: "Action",
              render: (r) => (
                <Link
                  href={`/investigations/${r.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-orange/15 hover:bg-orange text-orange hover:text-white border border-orange/40 hover:border-orange text-xs font-mono font-medium transition-all"
                >
                  Inspect Case →
                </Link>
              ),
            },
          ]}
          rows={investigations}
        />
      </div>
    </div>
  );
}
