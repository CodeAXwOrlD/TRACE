"""Fraud Typology Pattern Classifier.

Deterministic classification of patterns matching FraudPatternContract:
- card_testing
- cnp
- cnp_new_device
- out_of_region
- account_takeover
- undocumented
- none
"""

from typing import Any, Dict, List
from agent.schemas.investigation import FraudPatternContract
from agent.schemas.evidence import EvidenceItem


class PatternAnalyzer:
    """Classifies transaction and evidence into standard fraud typology patterns."""

    @staticmethod
    def classify(
        transaction: Dict[str, Any],
        evidence: List[EvidenceItem],
        connected_cards: List[str],
        episode_txn_ids: List[str],
    ) -> FraudPatternContract:
        """Deterministically determine fraud typology from evidence and facts."""
        steps = {e.step for e in evidence if e.direction == "concern"}

        # 1. Card Testing
        if "card_testing" in steps or len(episode_txn_ids) >= 3 and any("micro" in e.finding.lower() for e in evidence):
            return "card_testing"

        # 2. Shared / New Device CNP
        if "device_link" in steps or "graph_cluster" in steps:
            return "cnp_new_device"

        if "new_device" in steps:
            return "cnp_new_device"

        # 3. Geo Mismatch / Out of region
        if "geo_mismatch" in steps:
            return "out_of_region"

        # 4. Account Takeover
        if "device_churn" in steps or "spend_deviation" in steps and "velocity_burst" in steps:
            return "account_takeover"

        # 5. Generic Card-Not-Present
        has_concern = any(e.direction == "concern" for e in evidence)
        channel = str(transaction.get("channel", "")).lower()
        if has_concern:
            if "online" in channel or "cnp" in channel or transaction.get("is_online", True):
                return "cnp"
            return "undocumented"

        # 6. No fraud pattern
        return "none"
