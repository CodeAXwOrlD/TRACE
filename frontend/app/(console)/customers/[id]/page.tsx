import { notFound } from "next/navigation";
import { getCustomer } from "@/lib/api";
import { Panel } from "@/components/ui/Panel";
import { Metric } from "@/components/ui/Metric";

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = await getCustomer(params.id);
  if (!customer) notFound();

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <div className="font-mono text-[11px] tracking-wider text-blue mb-1">CUSTOMER</div>
        <h1 className="text-2xl font-bold tracking-tight">{customer.id}</h1>
      </div>

      <Panel title="RISK" className="mb-6">
        <div className="text-xl font-semibold">{customer.riskLevel}</div>
      </Panel>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Metric label="Connected cards" value={customer.connectedCards} />
        <Metric label="Transactions" value={customer.transactionCount} />
        <Metric label="Devices" value={customer.deviceCount} />
        <Metric label="Previous cases" value={customer.previousCases} tone={customer.previousCases > 0 ? "red" : undefined} />
      </div>
    </div>
  );
}
