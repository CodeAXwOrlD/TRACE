import type { Verdict } from "@/lib/types";
import { Badge } from "./Badge";

const toneFor: Record<Verdict, "fraud" | "legit" | "unsure"> = {
  FRAUD: "fraud",
  LEGITIMATE: "legit",
  UNCERTAIN: "unsure",
};
const labelFor: Record<Verdict, string> = {
  FRAUD: "Fraud",
  LEGITIMATE: "Legitimate",
  UNCERTAIN: "Uncertain",
};

/** Never displays risk_score as a probability/verdict (Rules.md #1) — this only renders the verdict word. */
export function RiskBadge({ verdict }: { verdict: Verdict }) {
  return <Badge tone={toneFor[verdict]}>{labelFor[verdict]}</Badge>;
}
