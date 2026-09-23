"""Unit tests for ScoringEngine: separation of risk score, uncertainty, and 3-outcome model."""

import unittest
from agent.scoring import ScoringEngine
from agent.schemas.evidence import EvidenceItem


class TestScoringEngine(unittest.TestCase):
    def test_fraud_outcome_with_low_uncertainty(self):
        # Multiple strong concern items, no ease items
        evidence = [
            EvidenceItem(step="device_link", finding="Device on 4 cards", direction="concern", weight=0.90),
            EvidenceItem(step="velocity_burst", finding="Burst authorizations", direction="concern", weight=0.85),
            EvidenceItem(step="geo_mismatch", finding="Out of country", direction="concern", weight=0.75),
        ]
        prob, uncertainty, verdict = ScoringEngine.calculate(
            transaction={"risk_score": 0.85},
            evidence=evidence,
        )
        self.assertGreaterEqual(prob, 0.70)
        self.assertEqual(uncertainty, "LOW")
        self.assertEqual(verdict, "FRAUD")

    def test_legitimate_outcome_with_low_uncertainty(self):
        # Strong ease items, no concerns
        evidence = [
            EvidenceItem(step="auth_verification", finding="Verified 3DS", direction="ease", weight=0.90),
            EvidenceItem(step="device_trust", finding="Known customer device", direction="ease", weight=0.80),
        ]
        prob, uncertainty, verdict = ScoringEngine.calculate(
            transaction={"risk_score": 0.15},
            evidence=evidence,
        )
        self.assertLessEqual(prob, 0.30)
        self.assertEqual(uncertainty, "LOW")
        self.assertEqual(verdict, "LEGITIMATE")

    def test_conflicting_evidence_triggers_uncertain_outcome(self):
        # Strong concern AND strong ease (e.g. verified 3DS but also device linked to other cards)
        evidence = [
            EvidenceItem(step="device_link", finding="Device on other cards", direction="concern", weight=0.85),
            EvidenceItem(step="auth_verification", finding="Verified 3DS", direction="ease", weight=0.85),
        ]
        prob, uncertainty, verdict = ScoringEngine.calculate(
            transaction={"risk_score": 0.60},
            evidence=evidence,
        )
        # Conflicting signals MUST yield HIGH uncertainty and UNCERTAIN verdict
        self.assertEqual(uncertainty, "HIGH")
        self.assertEqual(verdict, "UNCERTAIN")

    def test_risk_score_is_not_directly_verdict(self):
        # High risk score (0.90) but verified strong authentication with no concern evidence
        evidence = [
            EvidenceItem(step="auth_verification", finding="Biometric passkey verified", direction="ease", weight=0.95),
            EvidenceItem(step="device_trust", finding="Primary phone", direction="ease", weight=0.85),
        ]
        prob, uncertainty, verdict = ScoringEngine.calculate(
            transaction={"risk_score": 0.90},  # input ML risk score is high
            evidence=evidence,
        )
        # The system does NOT blindly mark FRAUD just because risk_score > 0.6
        self.assertNotEqual(verdict, "FRAUD")
        self.assertLess(prob, 0.50)


if __name__ == "__main__":
    unittest.main()
