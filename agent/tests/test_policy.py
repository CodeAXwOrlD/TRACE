"""Unit tests for PolicyEngine and next actions."""

import unittest
from agent.policy import PolicyEngine
from agent.schemas.evidence import EvidenceItem


class TestPolicyEngine(unittest.TestCase):
    def test_policy_r6_shared_device(self):
        evidence = [
            EvidenceItem(step="device_link", finding="Device shared with 3 cards", direction="concern", weight=0.85),
        ]
        policy, actions = PolicyEngine.evaluate(
            verdict="FRAUD",
            fraud_probability=0.88,
            uncertainty="LOW",
            pattern="cnp_new_device",
            evidence=evidence,
            connected_cards=["card_1", "card_2"],
            exposure_usd=800.0,
        )
        self.assertEqual(policy, "R6")
        self.assertIn("BLOCK_CARD", actions)
        self.assertIn("ESCALATE_CASE", actions)
        self.assertIn("MONITOR_CONNECTED_CARDS", actions)

    def test_policy_r7_card_testing(self):
        policy, actions = PolicyEngine.evaluate(
            verdict="FRAUD",
            fraud_probability=0.82,
            uncertainty="LOW",
            pattern="card_testing",
            evidence=[],
            connected_cards=[],
            exposure_usd=300.0,
        )
        self.assertEqual(policy, "R7")
        self.assertIn("BLOCK_CARD", actions)
        self.assertIn("REISSUE_CARD", actions)

    def test_policy_r9_uncertainty_escalation(self):
        policy, actions = PolicyEngine.evaluate(
            verdict="UNCERTAIN",
            fraud_probability=0.55,
            uncertainty="HIGH",
            pattern="undocumented",
            evidence=[],
            connected_cards=[],
            exposure_usd=500.0,
        )
        self.assertEqual(policy, "R9")
        self.assertEqual(actions, ["ESCALATE_TO_ANALYST"])

    def test_policy_r2_authenticated_legitimate(self):
        evidence = [
            EvidenceItem(step="auth_verification", finding="3DS verified", direction="ease", weight=0.85),
        ]
        policy, actions = PolicyEngine.evaluate(
            verdict="LEGITIMATE",
            fraud_probability=0.10,
            uncertainty="LOW",
            pattern="none",
            evidence=evidence,
            connected_cards=[],
            exposure_usd=150.0,
        )
        self.assertEqual(policy, "R2")
        self.assertEqual(actions, ["CLOSE_NO_FRAUD"])


if __name__ == "__main__":
    unittest.main()
