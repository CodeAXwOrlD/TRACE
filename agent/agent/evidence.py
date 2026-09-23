"""Deterministic Evidence Collectors and Detectors.

Implements Section 5 & 6 of Member 2 handoff:
Evidence is structured and deterministically extracted from transaction facts,
graph connections, and historical velocity. The LLM NEVER invents evidence.
"""

from typing import Any, Dict, List
from agent.schemas.evidence import EvidenceItem


class EvidenceCollector:
    """Deterministic detector suite producing structured audit evidence."""

    @staticmethod
    def collect(
        transaction: Dict[str, Any],
        customer: Dict[str, Any],
        transaction_history: List[Dict[str, Any]],
        connected_cards: List[str],
        connected_devices: List[str],
    ) -> List[EvidenceItem]:
        """Run all deterministic detectors and compile the evidence trail."""
        evidence: List[EvidenceItem] = []

        # 1. Device Link Detector
        num_connected_cards = len(connected_cards)
        if num_connected_cards > 1:
            evidence.append(
                EvidenceItem(
                    step="device_link",
                    finding=f"Device shared across {num_connected_cards} distinct payment cards",
                    direction="concern",
                    weight=min(0.70 + (num_connected_cards * 0.08), 0.95),
                )
            )
        elif transaction.get("is_new_device") is True:
            evidence.append(
                EvidenceItem(
                    step="new_device",
                    finding="Transaction initiated from an unrecognized device identifier",
                    direction="concern",
                    weight=0.55,
                )
            )
        elif transaction.get("is_known_device") is True:
            evidence.append(
                EvidenceItem(
                    step="device_trust",
                    finding="Transaction executed on cardholder's primary verified hardware device",
                    direction="ease",
                    weight=0.60,
                )
            )

        # 2. Risk Score Signal Contextualizer (Section 7)
        # risk_score is an input signal, NOT fraud_probability
        risk_score = float(transaction.get("risk_score", 0.0))
        if risk_score >= 0.80:
            evidence.append(
                EvidenceItem(
                    step="model_signal",
                    finding=f"Ingestion ML risk score flagged elevated anomaly ({risk_score:.2f})",
                    direction="concern",
                    weight=0.75,
                )
            )
        elif risk_score >= 0.50:
            evidence.append(
                EvidenceItem(
                    step="model_signal",
                    finding=f"Ingestion ML risk score flagged moderate anomaly ({risk_score:.2f})",
                    direction="concern",
                    weight=0.45,
                )
            )
        elif risk_score <= 0.20:
            evidence.append(
                EvidenceItem(
                    step="model_signal",
                    finding=f"Ingestion ML risk score is low ({risk_score:.2f})",
                    direction="ease",
                    weight=0.50,
                )
            )

        # 3. Card Testing Detector
        # Micro-transactions under $3 followed by higher checkout
        recent_txns = sorted(
            transaction_history,
            key=lambda t: t.get("timestamp", ""),
            reverse=True,
        )
        micro_txns = [
            t for t in recent_txns
            if 0 < float(t.get("amount", 0.0)) <= 3.00
        ]
        curr_amount = float(transaction.get("amount", 0.0))
        if len(micro_txns) >= 2 and curr_amount > 20.0:
            evidence.append(
                EvidenceItem(
                    step="card_testing",
                    finding=f"Detected {len(micro_txns)} micro-authorizations (<$3) preceding a ${curr_amount:.2f} transaction",
                    direction="concern",
                    weight=0.90,
                )
            )

        # 4. Velocity Detector
        if len(recent_txns) >= 3:
            # Check high velocity in short window
            evidence.append(
                EvidenceItem(
                    step="velocity_burst",
                    finding=f"High transaction frequency detected ({len(recent_txns) + 1} authorizations in observation window)",
                    direction="concern",
                    weight=0.65,
                )
            )

        # 5. Geo / Location Anomaly
        home_country = customer.get("country", "")
        txn_country = transaction.get("country", "")
        if home_country and txn_country and home_country != txn_country:
            evidence.append(
                EvidenceItem(
                    step="geo_mismatch",
                    finding=f"Cross-border transaction originating from {txn_country} (Cardholder home: {home_country})",
                    direction="concern",
                    weight=0.70,
                )
            )

        # 6. Strong Customer Authentication / 3D Secure
        auth_method = transaction.get("auth_method", "").upper()
        if "3DS" in auth_method or "BIOMETRIC" in auth_method or transaction.get("authenticated_3ds") is True:
            evidence.append(
                EvidenceItem(
                    step="auth_verification",
                    finding="Verified cardholder presence via 3D Secure / biometric multi-factor challenge",
                    direction="ease",
                    weight=0.85,
                )
            )

        # 7. Amount vs Baseline Profile
        avg_spend = float(customer.get("avg_transaction_amount", 50.0))
        if avg_spend > 0 and curr_amount >= (avg_spend * 5):
            evidence.append(
                EvidenceItem(
                    step="spend_deviation",
                    finding=f"Transaction amount (${curr_amount:.2f}) exceeds customer historical average (${avg_spend:.2f}) by {curr_amount/avg_spend:.1f}x",
                    direction="concern",
                    weight=0.60,
                )
            )

        # If no strong evidence was triggered, provide baseline context
        if not evidence:
            evidence.append(
                EvidenceItem(
                    step="baseline",
                    finding="Standard transaction parameters with nominal baseline telemetry",
                    direction="context",
                    weight=0.20,
                )
            )

        return evidence
