"""Unit tests for HistoricalCaseMatcher."""

import unittest
from agent.historical import HistoricalCaseMatcher
from agent.schemas.evidence import EvidenceItem
from agent.schemas.investigation import SimilarCaseContract
from backend.app.data.dataset_loader import load_closed_cases


class TestHistoricalCaseMatcher(unittest.TestCase):
    def test_similar_case_matching_uses_submitted_history(self):
        historical = next(case for case in load_closed_cases() if case["outcome"] in ("confirmed_fraud", "cleared"))
        cases = HistoricalCaseMatcher.match(
            pattern="none",
            transaction={"card_id": historical["cardId"], "customer_id": historical["customerId"]},
            evidence=[],
            connected_cards=[],
            limit=3,
        )

        self.assertGreater(len(cases), 0)
        top_match = cases[0]
        self.assertIsInstance(top_match, SimilarCaseContract)
        self.assertEqual(top_match.case_id, historical["caseId"])
        self.assertEqual(top_match.similarity, 0.95)
        self.assertEqual(top_match.reason, "Shared customer and card")


if __name__ == "__main__":
    unittest.main()
