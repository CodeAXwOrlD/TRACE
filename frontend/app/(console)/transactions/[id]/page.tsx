import { notFound } from "next/navigation";
import { getTransaction } from "@/lib/api";
import { Panel } from "@/components/ui/Panel";
import { formatTimestamp, formatUsd } from "@/lib/utils";

export default async function TransactionDetailPage({ params }: { params: { id: string } }) {
  const txn = await getTransaction(params.id);
  if (!txn) notFound();

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <div className="font-mono text-[11px] tracking-wider text-blue mb-1">TRANSACTION</div>
        <h1 className="text-2xl font-bold tracking-tight font-mono">{txn.id}</h1>
      </div>

      <Panel title="DETAILS">
        <dl className="grid grid-cols-2 gap-y-3 font-mono text-sm">
          <dt className="text-muted">Amount</dt>
          <dd className="text-right text-[#dfe4e8]">{formatUsd(txn.amount)}</dd>
          <dt className="text-muted">Timestamp</dt>
          <dd className="text-right text-[#dfe4e8]">{formatTimestamp(txn.timestamp)}</dd>
          <dt className="text-muted">Channel</dt>
          <dd className="text-right text-[#dfe4e8]">{txn.channel}</dd>
          <dt className="text-muted">Card</dt>
          <dd className="text-right text-[#dfe4e8]">{txn.cardId}</dd>
          <dt className="text-muted">Device</dt>
          <dd className="text-right text-[#dfe4e8]">{txn.deviceId ?? "—"}</dd>
          <dt className="text-muted">Billing region</dt>
          <dd className="text-right text-[#dfe4e8]">{txn.billingRegion}</dd>
          <dt className="text-muted">Email domain</dt>
          <dd className="text-right text-[#dfe4e8]">{txn.emailDomain}</dd>
          <dt className="text-muted">Risk score (input only)</dt>
          <dd className="text-right text-[#dfe4e8]">{txn.riskScore.toFixed(2)}</dd>
        </dl>
      </Panel>
    </div>
  );
}
