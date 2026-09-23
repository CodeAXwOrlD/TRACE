"""End-to-end test of LangGraph investigation workflow without external API calls."""

import unittest
from agent.runner import InvestigationRunner
from agent.schemas.investigation import InvestigationContract


class TestGraphWorkflow(unittest.TestCase):
    def test_complete_investigation_workflow_deterministic(self):
        runner = InvestigationRunner()

        initial_state = {
            "case_id": "CASE_TEST_001",
            "transaction_id": "txn_root_77",
            "card_id": "card_gold_55",
            "transaction": {
                "transaction_id": "txn_root_77",
                "amount": 950.00,
                "merchant": "LuxuryElectronics.com",
                "channel": "online",
                "is_new_device": True,
                "risk_score": 0.82,
                "timestamp": "2026-09-20T14:30:00Z",
            },
            "customer": {
                "customer_id": "cust_12",
                "country": "US",
                "avg_transaction_amount": 65.00,
            },
            "transaction_history": [
                {
                    "transaction_id": "txn_prior_1",
                    "amount": 1.50,
                    "timestamp": "2026-09-20T14:15:00Z",
                    "risk_score": 0.40,
                },
                {
                    "transaction_id": "txn_prior_2",
                    "amount": 2.00,
                    "timestamp": "2026-09-20T14:20:00Z",
                    "risk_score": 0.45,
                },
            ],
            "connected_cards": ["card_gold_55", "card_other_22", "card_other_33"],
            "connected_devices": ["dev_shared_99"],
        }

        # Run complete workflow
        result = runner.run(initial_state)

        # Assert contract compliance
        self.assertIsInstance(result, InvestigationContract)
        self.assertEqual(result.case_id, "CASE_TEST_001")
        self.assertEqual(result.transaction_id, "txn_root_77")
        self.assertEqual(result.card_id, "card_gold_55")

        # Outcome validations
        self.assertEqual(result.verdict, "FRAUD")
        self.assertGreaterEqual(result.fraud_probability, 0.70)
        self.assertEqual(result.uncertainty, "LOW")

        # First suspicious transaction detection
        self.assertEqual(result.first_suspicious_txn_id, "txn_prior_1")
        self.assertIn("txn_prior_1", result.episode_txn_ids)
        self.assertIn("txn_root_77", result.episode_txn_ids)
        self.assertAlmostEqual(result.exposure_usd, 953.50, places=2)

        # Policy & Next actions
        self.assertEqual(result.policy, "R6")
        self.assertIn("BLOCK_CARD", result.next_actions)
        self.assertIn("ESCALATE_CASE", result.next_actions)

        # Evidence audit trail
        self.assertGreaterEqual(len(result.evidence), 3)

        # Rationale generated
        self.assertIsInstance(result.rationale, str)
        self.assertGreater(len(result.rationale), 20)

    def test_missing_data_handled_gracefully(self):
        # Even with minimal / empty data, system should not throw unhandled exceptions
        runner = InvestigationRunner()
        minimal_state = {
            "transaction_id": "txn_sparse_01",
            "card_id": "card_sparse_01",
        }
        result = runner.run(minimal_state)
        self.assertIsInstance(result, InvestigationContract)
        self.assertEqual(result.verdict, "UNCERTAIN")
        self.assertEqual(result.uncertainty, "HIGH")
        self.assertEqual(result.policy, "R9")


if __name__ == "__main__":
    unittest.main()
