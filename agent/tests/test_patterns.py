"""Unit tests for PatternAnalyzer fraud typology classification."""

import unittest
from agent.patterns import PatternAnalyzer
from agent.schemas.evidence import EvidenceItem


class TestPatternAnalyzer(unittest.TestCase):
    def test_classify_card_testing(self):
        evidence = [
            EvidenceItem(step="card_testing", finding="Detected 2 micro-authorizations", direction="concern", weight=0.9),
        ]
        pattern = PatternAnalyzer.classify(
            transaction={"channel": "online"},
            evidence=evidence,
            connected_cards=["card_1"],
            episode_txn_ids=["t1", "t2", "t3"],
        )
        self.assertEqual(pattern, "card_testing")

    def test_classify_cnp_new_device(self):
        evidence = [
            EvidenceItem(step="device_link", finding="Device shared with 3 cards", direction="concern", weight=0.8),
        ]
        pattern = PatternAnalyzer.classify(
            transaction={"channel": "online"},
            evidence=evidence,
            connected_cards=["card_1", "card_2", "card_3"],
            episode_txn_ids=["t1"],
        )
        self.assertEqual(pattern, "cnp_new_device")

    def test_classify_out_of_region(self):
        evidence = [
            EvidenceItem(step="geo_mismatch", finding="Cross border transaction", direction="concern", weight=0.7),
        ]
        pattern = PatternAnalyzer.classify(
            transaction={"channel": "pos"},
            evidence=evidence,
            connected_cards=["card_1"],
            episode_txn_ids=["t1"],
        )
        self.assertEqual(pattern, "out_of_region")

    def test_classify_none_for_legitimate(self):
        evidence = [
            EvidenceItem(step="auth_verification", finding="Verified 3DS", direction="ease", weight=0.85),
        ]
        pattern = PatternAnalyzer.classify(
            transaction={"channel": "online"},
            evidence=evidence,
            connected_cards=["card_1"],
            episode_txn_ids=["t1"],
        )
        self.assertEqual(pattern, "none")


if __name__ == "__main__":
    unittest.main()
