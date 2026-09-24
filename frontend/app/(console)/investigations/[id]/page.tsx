import { notFound } from "next/navigation";
import { getInvestigation, getInvestigationGraph, getEvidence } from "@/lib/api";
import { InvestigationWorkspace } from "@/components/workbench/InvestigationWorkspace";

export default async function InvestigationPage({ params }: { params: { id: string } }) {
  const investigation = await getInvestigation(params.id);
  if (!investigation) notFound();

  const [graph, evidence] = await Promise.all([
    getInvestigationGraph(investigation.caseId),
    getEvidence(investigation.caseId),
  ]);

  return <InvestigationWorkspace investigation={investigation} graph={graph} evidence={evidence} />;
}
