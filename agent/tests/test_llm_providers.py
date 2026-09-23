"""Unit tests for LLM providers, mock mode, and error fallback."""

import unittest
from pydantic import BaseModel
from agent.llm.mock import MockLLMProvider
from agent.llm.base import BaseLLMProvider
from agent.explanation import ExplanationGenerator
from agent.schemas.evidence import EvidenceItem


class SampleResponseModel(BaseModel):
    summary: str
    verdict: str
    probability: float


class FailingProvider(BaseLLMProvider):
    def generate_text(self, prompt: str, system_prompt=None) -> str:
        raise ConnectionError("External API connection timed out")

    def generate_structured(self, prompt: str, response_model, system_prompt=None):
        raise TimeoutError("External API call timeout")


class TestLLMProviders(unittest.TestCase):
    def test_mock_provider_text_and_structured(self):
        provider = MockLLMProvider()
        text = provider.generate_text("Device shared across 3 payment cards")
        self.assertIn("device", text.lower())

        structured = provider.generate_structured(
            prompt="Evaluate transaction with device syndication and high risk",
            response_model=SampleResponseModel,
        )
        self.assertIsInstance(structured, SampleResponseModel)
        self.assertIn(structured.verdict, ["FRAUD", "LEGITIMATE", "UNCERTAIN"])
        self.assertIsInstance(structured.probability, float)

    def test_explanation_generator_graceful_fallback_on_failure(self):
        # Even if the provider throws network/timeout exceptions, ExplanationGenerator MUST NOT crash
        failing_provider = FailingProvider()
        explainer = ExplanationGenerator(provider=failing_provider)

        evidence = [
            EvidenceItem(step="device_link", finding="Device shared with 3 cards", direction="concern", weight=0.85)
        ]

        rationale = explainer.generate(
            case_id="case_fail_1",
            transaction_id="txn_999",
            card_id="card_111",
            verdict="FRAUD",
            fraud_probability=0.88,
            uncertainty="LOW",
            pattern="cnp_new_device",
            first_suspicious_txn_id="txn_995",
            episode_txn_ids=["txn_995", "txn_999"],
            exposure_usd=1200.0,
            evidence=evidence,
            similar_cases=[],
            policy="R6",
            next_actions=["BLOCK_CARD", "ESCALATE_CASE"],
        )

        self.assertIsInstance(rationale, str)
        self.assertIn("Policy R6", rationale)
        self.assertIn("BLOCK_CARD", rationale)


if __name__ == "__main__":
    unittest.main()
