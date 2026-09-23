"""Unit tests for HistoricalCaseMatcher."""

import unittest
from agent.historical import HistoricalCaseMatcher
from agent.schemas.evidence import EvidenceItem
from agent.schemas.investigation import SimilarCaseContract


class TestHistoricalCaseMatcher(unittest.TestCase):
    def test_similar_case_matching_for_device_sharing(self):
        evidence = [
            EvidenceItem(step="device_link", finding="Device shared with 3 cards", direction="concern", weight=0.85),
        ]
        cases = HistoricalCaseMatcher.match(
            pattern="cnp_new_device",
            transaction={"amount": 1250.0},
            evidence=evidence,
            connected_cards=["card_1", "card_2", "card_3"],
            limit=3,
        )

        self.assertGreater(len(cases), 0)
        top_match = cases[0]
        self.assertIsInstance(top_match, SimilarCaseContract)
        self.assertEqual(top_match.case_id, "CASE-7012")
        self.assertGreaterEqual(top_match.similarity, 0.70)
        self.assertEqual(top_match.outcome, "confirmed_fraud")

    def test_similar_case_matching_for_card_testing(self):
        evidence = [
            EvidenceItem(step="card_testing", finding="Detected 2 micro-authorizations", direction="concern", weight=0.9),
        ]
        cases = HistoricalCaseMatcher.match(
            pattern="card_testing",
            transaction={"amount": 350.0},
            evidence=evidence,
            connected_cards=["card_1"],
            limit=3,
        )

        self.assertGreater(len(cases), 0)
        self.assertEqual(cases[0].case_id, "CASE-6841")
        self.assertEqual(cases[0].outcome, "confirmed_fraud")


if __name__ == "__main__":
    unittest.main()
