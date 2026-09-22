import { getDevice } from "@/lib/api";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function DeviceDetailPage({ params }: { params: { id: string } }) {
  const device = await getDevice(params.id);

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <div className="font-mono text-[11px] tracking-wider text-blue mb-1">DEVICE</div>
        <h1 className="text-2xl font-bold tracking-tight font-mono">{params.id}</h1>
      </div>

      <Panel title="DEVICE PROFILE">
        {device ? (
          <dl className="grid grid-cols-2 gap-y-3 font-mono text-sm">
            <dt className="text-muted">Type</dt>
            <dd className="text-right text-[#dfe4e8]">{device.deviceType}</dd>
            <dt className="text-muted">Info</dt>
            <dd className="text-right text-[#dfe4e8]">{device.deviceInfo}</dd>
            <dt className="text-muted">Cards seen on</dt>
            <dd className="text-right text-[#dfe4e8]">{device.cardsSeenOn.length}</dd>
          </dl>
        ) : (
          <EmptyState
            title="No device record"
            description="Member 3's TigerGraph load will populate DeviceProfile vertices here (Architecture.md section 3)."
          />
        )}
      </Panel>
    </div>
  );
}
