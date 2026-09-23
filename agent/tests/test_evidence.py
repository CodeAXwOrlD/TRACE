"""Unit tests for deterministic EvidenceCollector and EvidenceItem schema."""

import unittest
from agent.evidence import EvidenceCollector
from agent.schemas.evidence import EvidenceItem


class TestEvidenceCollector(unittest.TestCase):
    def test_direction_normalization(self):
        # Test synonym mapping: support -> ease, neutral -> context
        item1 = EvidenceItem(
            step="test_step",
            finding="Legitimate auth",
            direction="support",  # should normalize to 'ease'
            weight=0.7,
        )
        self.assertEqual(item1.direction, "ease")

        item2 = EvidenceItem(
            step="test_step",
            finding="Nominal metadata",
            direction="neutral",  # should normalize to 'context'
            weight=0.1,
        )
        self.assertEqual(item2.direction, "context")

    def test_device_link_detector(self):
        evidence = EvidenceCollector.collect(
            transaction={"amount": 100.0, "risk_score": 0.5},
            customer={"country": "US"},
            transaction_history=[],
            connected_cards=["card_1", "card_2", "card_3"],
            connected_devices=["dev_A"],
        )
        steps = [e.step for e in evidence]
        self.assertIn("device_link", steps)
        link_item = next(e for e in evidence if e.step == "device_link")
        self.assertEqual(link_item.direction, "concern")
        self.assertGreaterEqual(link_item.weight, 0.70)

    def test_card_testing_detector(self):
        history = [
            {"transaction_id": "t1", "amount": 1.25, "timestamp": "2026-09-20T10:00:00Z"},
            {"transaction_id": "t2", "amount": 1.50, "timestamp": "2026-09-20T10:02:00Z"},
        ]
        evidence = EvidenceCollector.collect(
            transaction={"transaction_id": "t3", "amount": 250.0, "risk_score": 0.7},
            customer={},
            transaction_history=history,
            connected_cards=["card_1"],
            connected_devices=["dev_A"],
        )
        steps = [e.step for e in evidence]
        self.assertIn("card_testing", steps)
        test_item = next(e for e in evidence if e.step == "card_testing")
        self.assertEqual(test_item.direction, "concern")
        self.assertGreaterEqual(test_item.weight, 0.85)

    def test_3ds_verification_detector(self):
        evidence = EvidenceCollector.collect(
            transaction={"amount": 50.0, "auth_method": "3DS_VERIFIED", "risk_score": 0.15},
            customer={"country": "US"},
            transaction_history=[],
            connected_cards=["card_1"],
            connected_devices=["dev_A"],
        )
        steps = [e.step for e in evidence]
        self.assertIn("auth_verification", steps)
        auth_item = next(e for e in evidence if e.step == "auth_verification")
        self.assertEqual(auth_item.direction, "ease")


if __name__ == "__main__":
    unittest.main()
