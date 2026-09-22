import { notFound } from "next/navigation";
import Link from "next/link";
import { getCaseById, getInvestigation } from "@/lib/api";
import { Panel } from "@/components/ui/Panel";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { formatTimestamp, formatUsd } from "@/lib/utils";

export default async function CaseDetailPage({ params }: { params: { id: string } }) {
  const caseRecord = await getCaseById(params.id);
  if (!caseRecord) notFound();

  const investigation = caseRecord.investigationId ? await getInvestigation(caseRecord.investigationId) : undefined;

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="font-mono text-[11px] tracking-wider text-blue mb-1">CASE</div>
          <h1 className="text-2xl font-bold tracking-tight">{caseRecord.id}</h1>
        </div>
        {caseRecord.verdict !== "PENDING" && <RiskBadge verdict={caseRecord.verdict} />}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Panel title="EXPOSURE">
          <div className="text-2xl font-bold">{formatUsd(caseRecord.exposureUsd)}</div>
        </Panel>
        <Panel title="OPENED">
          <div className="text-lg">{formatTimestamp(caseRecord.openedAt)}</div>
        </Panel>
      </div>

      <Panel title="SUMMARY" className="mb-6">
        <p className="text-[#dfe4e8] leading-relaxed">{caseRecord.summary}</p>
      </Panel>

      {investigation && (
        <Link
          href={`/investigations/${investigation.id}`}
          className="inline-flex items-center bg-orange text-white border border-orange px-5 py-3 rounded-lg font-semibold text-[13px] transition-all hover:-translate-y-0.5"
        >
          Open full investigation workspace →
        </Link>
      )}
    </div>
  );
}
