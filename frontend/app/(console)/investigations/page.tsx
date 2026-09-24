import { getInvestigations } from "@/lib/api";
import { InvestigationQueueView } from "@/components/workbench/InvestigationQueueView";

export default async function InvestigationsPage() {
  const investigations = await getInvestigations();

  return (
    <div className="py-2">
      <InvestigationQueueView initialInvestigations={investigations} />
    </div>
  );
}
