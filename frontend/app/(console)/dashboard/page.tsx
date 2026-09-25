import Link from "next/link";
import { getDashboardStats, getCases, getInvestigations, getHealth } from "@/lib/api";
import { Metric } from "@/components/ui/Metric";
import { Panel } from "@/components/ui/Panel";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { SystemStatusRow } from "@/components/console/SystemStatusRow";
import { formatTimestamp, formatUsd } from "@/lib/utils";

export default async function DashboardPage() {
  const [stats, cases, investigations, health] = await Promise.all([
    getDashboardStats(),
    getCases(),
    getInvestigations(),
    getHealth().catch(() => null),
  ]);

  return (
    <div>
      <div className="mb-8">
        <div className="font-mono text-[11px] tracking-wider text-blue mb-1">DASHBOARD</div>
        <h1 className="text-2xl font-bold tracking-tight">Intelligence overview</h1>
      </div>

      <SystemStatusRow />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Metric label="Active cases" value={stats.activeCases} />
        <Metric label="High risk" value={stats.highRisk} tone="red" />
        <Metric label="Investigations" value={stats.investigations} />
        <Metric label="Resolved" value={stats.resolved} tone="green" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Panel title="RECENT INVESTIGATIONS" className="lg:col-span-2">
          <ul className="divide-y divide-white/[.06]">
            {investigations.map((inv) => (
              <li key={inv.id}>
                <Link href={`/investigations/${inv.id}`} className="flex items-center justify-between py-3 hover:bg-white/[.02] px-2 -mx-2 rounded transition-colors">
                  <div>
                    <div className="font-mono text-sm text-[#dfe4e8]">{inv.caseId}</div>
                    <div className="text-xs text-muted">{formatTimestamp(inv.createdAt)} · Customer {inv.customerId}</div>
                  </div>
                  <RiskBadge verdict={inv.risk.verdict} />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="RISK DISTRIBUTION">
          <div className="space-y-3">
            {(["FRAUD", "LEGITIMATE", "UNCERTAIN"] as const).map((v) => {
              const count = cases.filter((c) => c.verdict === v).length;
              const pct = cases.length ? Math.round((count / cases.length) * 100) : 0;
              const color = v === "FRAUD" ? "bg-red" : v === "LEGITIMATE" ? "bg-green" : "bg-amber";
              return (
                <div key={v}>
                  <div className="flex justify-between text-xs font-mono text-muted mb-1">
                    <span>{v}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-1.5 rounded bg-white/[.07] overflow-hidden">
                    <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="CASE ACTIVITY">
          <ul className="space-y-2">
            {cases.slice(0, 5).map((c) => (
              <li key={c.id} className="flex justify-between text-sm">
                <Link href={`/cases/${c.id}`} className="font-mono text-[#dfe4e8] hover:text-white">
                  {c.id}
                </Link>
                <span className="text-muted font-mono text-xs">{formatUsd(c.exposureUsd)}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="GRAPH ACTIVITY">
          <div className="text-sm text-muted">
            {investigations.length} investigation subgraphs cached. Open any investigation to render its connected-records graph.
          </div>
        </Panel>

        <Panel title="AGENT ACTIVITY">
          <div className="flex items-center gap-2 mb-2">
            <StatusIndicator
              label={
                health?.agent === "ready"
                  ? "AGENT READY"
                  : health?.agent === "busy"
                  ? "AGENT BUSY"
                  : "AGENT OFFLINE"
              }
              tone={
                health?.agent === "ready"
                  ? "green"
                  : health?.agent === "busy"
                  ? "amber"
                  : "red"
              }
            />
          </div>
          <div className="text-sm text-muted">
            {health?.agent === "ready"
              ? "No investigation currently running. Start one from the Investigations tab."
              : health?.agent === "busy"
              ? "Investigation in progress."
              : "Agent service is currently offline or unreachable."}
          </div>
        </Panel>
      </div>
    </div>
  );
}
