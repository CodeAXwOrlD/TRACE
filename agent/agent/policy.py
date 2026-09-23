"""Deterministic Policy Engine.

Implements Section 11 of Member 2 handoff:
Maps investigation findings, verdict, and topology to standardized policy rules
(R1 through R9) and generates structured next actions for analysts and card systems.
"""

from typing import Any, Dict, List, Tuple
from agent.schemas.evidence import EvidenceItem
from agent.schemas.investigation import VerdictContract, UncertaintyContract, FraudPatternContract


class PolicyEngine:
    """Evaluates explicit policy rules and assigns actionable next steps."""

    @staticmethod
    def evaluate(
        verdict: VerdictContract,
        fraud_probability: float,
        uncertainty: UncertaintyContract,
        pattern: FraudPatternContract,
        evidence: List[EvidenceItem],
        connected_cards: List[str],
        exposure_usd: float,
    ) -> Tuple[str, List[str]]:
        """Evaluate investigation metrics against standardized policies R1-R9.

        Returns: (policy_id, next_actions)
        """
        steps = {e.step for e in evidence if e.direction == "concern"}

        # Rule 9: High Uncertainty or Borderline -> Escalate to human analyst
        if verdict == "UNCERTAIN" or uncertainty == "HIGH":
            return "R9", ["ESCALATE_TO_ANALYST"]

        # Rule 6: Shared device with multi-card connections / confirmed syndicate
        # (Primary PRD flagship policy)
        if len(connected_cards) > 1 or "device_link" in steps or "graph_cluster" in steps:
            return "R6", ["BLOCK_CARD", "ESCALATE_CASE", "MONITOR_CONNECTED_CARDS"]

        # Rule 8: High Cumulative Financial Exposure ($2,500+)
        if exposure_usd >= 2500.0 and verdict == "FRAUD":
            return "R8", ["BLOCK_CARD", "FREEZE_CLUSTER", "FILE_REGULATORY_REPORT"]

        # Rule 7: Card Testing Sequence
        if pattern == "card_testing":
            return "R7", ["BLOCK_CARD", "REISSUE_CARD"]

        # Rule 5: Account Takeover
        if pattern == "account_takeover":
            return "R5", ["SUSPEND_ACCOUNT", "FORCE_PASSWORD_RESET"]

        # Rule 4: Out of Region
        if pattern == "out_of_region":
            return "R4", ["TEMPORARY_HOLD", "CONTACT_CARDHOLDER"]

        # Rule 2: Strong authentication verified
        if any(e.step == "auth_verification" for e in evidence) and verdict == "LEGITIMATE":
            return "R2", ["CLOSE_NO_FRAUD"]

        # Rule 1: Single nominal low-risk transaction
        if verdict == "LEGITIMATE":
            return "R1", ["CLOSE_NO_FRAUD"]

        # Rule 3: Single anomaly / elevated risk needing step-up
        if fraud_probability > 0.50:
            return "R3", ["REQUEST_STEP_UP_AUTH", "MONITOR"]

        return "R9", ["ESCALATE_TO_ANALYST"]
