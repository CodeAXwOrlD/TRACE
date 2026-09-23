"""Unit tests for InvestigationState and Pydantic validation."""

import unittest
from agent.state import InvestigationStateModel
from agent.schemas.evidence import EvidenceItem
from agent.schemas.investigation import InvestigationContract, SimilarCaseContract


class TestInvestigationState(unittest.TestCase):
    def test_state_creation_and_contract_export(self):
        evidence_item = EvidenceItem(
            step="device_link",
            finding="Device on 3 other cards",
            direction="concern",
            weight=0.85,
        )
        similar_case = SimilarCaseContract(
            case_id="CASE-7012",
            similarity=0.88,
            outcome="confirmed_fraud",
            reason="Syndicate device match",
        )

        state = InvestigationStateModel(
            case_id="case_101",
            transaction_id="txn_450",
            card_id="card_999",
            verdict="FRAUD",
            fraud_probability=0.89,
            uncertainty="LOW",
            pattern="cnp_new_device",
            first_suspicious_txn_id="txn_448",
            episode_txn_ids=["txn_448", "txn_449", "txn_450"],
            connected_cards=["card_888", "card_777"],
            similar_cases=[similar_case],
            evidence=[evidence_item],
            policy="R6",
            next_actions=["BLOCK_CARD", "ESCALATE_CASE"],
            exposure_usd=1450.50,
            rationale="High-risk device sharing across 3 cards.",
        )

        contract = state.to_contract()
        self.assertIsInstance(contract, InvestigationContract)
        self.assertEqual(contract.case_id, "case_101")
        self.assertEqual(contract.verdict, "FRAUD")
        self.assertEqual(contract.fraud_probability, 0.89)
        self.assertEqual(contract.uncertainty, "LOW")
        self.assertEqual(contract.pattern, "cnp_new_device")
        self.assertEqual(contract.policy, "R6")
        self.assertEqual(len(contract.episode_txn_ids), 3)
        self.assertEqual(contract.exposure_usd, 1450.50)


if __name__ == "__main__":
    unittest.main()
