import Link from "next/link";
import { getCases } from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { formatTimestamp, formatUsd } from "@/lib/utils";
import type { Case } from "@/lib/types";

export default async function CasesPage() {
  const cases = await getCases();
  return (
    <div>
      <div className="mb-6">
        <div className="font-mono text-[11px] tracking-wider text-blue mb-1">CASES</div>
        <h1 className="text-2xl font-bold tracking-tight">Case queue</h1>
      </div>
      <div className="rounded-panel border border-white/[.08] bg-white/[.015] p-4">
        <DataTable<Case>
          columns={[
            { header: "Case", render: (r) => <Link href={`/cases/${r.id}`} className="font-mono text-[#dfe4e8] hover:text-white">{r.id}</Link> },
            { header: "Exposure", render: (r) => formatUsd(r.exposureUsd) },
            { header: "Opened", render: (r) => formatTimestamp(r.openedAt) },
            { header: "Verdict", render: (r) => (r.verdict === "PENDING" ? <span className="text-muted font-mono text-xs">PENDING</span> : <RiskBadge verdict={r.verdict} />) },
          ]}
          rows={cases}
        />
      </div>
    </div>
  );
}
