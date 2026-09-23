"""Graph Connection and Network Topology Analyzer.

Analyzes connected cards, shared devices, and fraud ring clusters.
"""

from typing import Any, Dict, List
from agent.schemas.evidence import EvidenceItem


class GraphAnalyzer:
    """Analyzes entity graph connections (devices, cards, accounts)."""

    @staticmethod
    def analyze_connections(
        card_id: str,
        connected_cards: List[str],
        connected_devices: List[str],
        transaction: Dict[str, Any],
    ) -> List[EvidenceItem]:
        """Inspect graph topology and produce graph-specific evidence findings."""
        evidence: List[EvidenceItem] = []

        # Filter out self
        external_cards = [c for c in connected_cards if c != card_id]

        if len(external_cards) >= 3:
            evidence.append(
                EvidenceItem(
                    step="graph_cluster",
                    finding=f"High-density device cluster: linked to {len(external_cards)} distinct customer payment cards",
                    direction="concern",
                    weight=0.88,
                )
            )
        elif len(external_cards) >= 1:
            evidence.append(
                EvidenceItem(
                    step="graph_link",
                    finding=f"Device shared with {len(external_cards)} other card ({external_cards[0]})",
                    direction="concern",
                    weight=0.72,
                )
            )

        if len(connected_devices) > 4:
            evidence.append(
                EvidenceItem(
                    step="device_churn",
                    finding=f"Card used across {len(connected_devices)} distinct hardware fingerprints within 7 days",
                    direction="concern",
                    weight=0.68,
                )
            )

        return evidence
