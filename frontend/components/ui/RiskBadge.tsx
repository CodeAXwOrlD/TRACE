import type { Verdict } from "@/lib/types";
import { Badge } from "./Badge";

/** Never displays risk_score as a probability/verdict — this strictly renders the verdict word. */
export function RiskBadge({ verdict }: { verdict?: Verdict | "PENDING" | string }) {
  const norm = (verdict || "PENDING").toUpperCase();
  if (norm === "FRAUD") {
    return <Badge tone="fraud">Fraud</Badge>;
  }
  if (norm === "LEGITIMATE") {
    return <Badge tone="legit">Legitimate</Badge>;
  }
  if (norm === "UNCERTAIN") {
    return <Badge tone="unsure">Uncertain</Badge>;
  }
  return <Badge tone="neutral">Pending</Badge>;
}
