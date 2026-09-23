"""Unit tests for HistoryAnalyzer, episode chaining, and exposure calculation."""

import unittest
from agent.history import HistoryAnalyzer


class TestHistoryAnalyzer(unittest.TestCase):
    def test_first_suspicious_transaction_identified_earlier_than_trigger(self):
        # Trigger transaction is t3 ($1200), preceded by micro-authorizations t1 ($1.50) and t2 ($2.00)
        history = [
            {"transaction_id": "t1", "amount": 1.50, "timestamp": "2026-09-20T10:00:00Z", "risk_score": 0.4},
            {"transaction_id": "t2", "amount": 2.00, "timestamp": "2026-09-20T10:05:00Z", "risk_score": 0.5},
        ]
        curr = {
            "transaction_id": "t3",
            "amount": 1200.0,
            "timestamp": "2026-09-20T10:10:00Z",
            "risk_score": 0.88,
        }

        first_suspicious, episode_ids, exposure = HistoryAnalyzer.analyze(curr, history)

        # Critical requirement: trigger_transaction != first_suspicious_txn
        self.assertEqual(first_suspicious, "t1")
        self.assertEqual(episode_ids, ["t1", "t2", "t3"])
        self.assertEqual(exposure, 1203.50)

    def test_single_transaction_no_prior_anomalies(self):
        # Only benign transactions in history
        history = [
            {"transaction_id": "t1", "amount": 45.0, "timestamp": "2026-09-18T10:00:00Z", "risk_score": 0.1},
        ]
        curr = {
            "transaction_id": "t2",
            "amount": 350.0,
            "timestamp": "2026-09-20T10:00:00Z",
            "risk_score": 0.8,
        }

        first_suspicious, episode_ids, exposure = HistoryAnalyzer.analyze(curr, history)
        # When no prior transactions are suspicious, the trigger is the first suspicious
        self.assertEqual(first_suspicious, "t2")
        self.assertEqual(episode_ids, ["t2"])
        self.assertEqual(exposure, 350.0)


if __name__ == "__main__":
    unittest.main()
