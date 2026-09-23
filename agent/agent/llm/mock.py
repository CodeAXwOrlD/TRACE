"""Mock LLM Provider for deterministic offline testing and hackathon demo reliability.

Implements Section 19 of Member 2 handoff:
When AI_MOCK_MODE=true or when external LLMs are unavailable, this provider
returns realistic, structured, deterministic responses without network calls.
"""

from typing import Optional, Type, TypeVar
from pydantic import BaseModel

from agent.llm.base import BaseLLMProvider

T = TypeVar("T", bound=BaseModel)


class MockLLMProvider(BaseLLMProvider):
    """Deterministic mock provider."""

    def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Return a deterministic analytical explanation based on prompt keywords."""
        lower = prompt.lower()
        if "device" in lower and ("shared" in lower or "multiple" in lower or "card" in lower):
            return (
                "Investigation reveals high-risk device syndication across multiple customer accounts. "
                "The primary trigger transaction was executed on a device linked to previously confirmed fraud cases. "
                "Transaction velocity and geo-location divergence further substantiate unauthorized account takeover."
            )
        if "card_testing" in lower or "testing" in lower:
            return (
                "Transaction history indicates classic card testing behavior with rapid micro-authorizations "
                "followed by an escalated high-value checkout attempt. Velocity anomaly confirms scripted carding attack."
            )
        if "legitimate" in lower or "cleared" in lower or "ease" in lower:
            return (
                "Transaction parameters align with cardholder historical purchasing patterns, trusted home network, "
                "and valid 3D Secure authentication. No high-risk device linkage or velocity anomalies detected."
            )
        return (
            "Evidence indicates anomalous behavioral and device patterns consistent with syndicate fraud. "
            "Policy evaluation mandates immediate containment and card suspension."
        )

    def generate_structured(
        self,
        prompt: str,
        response_model: Type[T],
        system_prompt: Optional[str] = None,
    ) -> T:
        """Produce a validated Pydantic object matching response_model deterministically."""
        lower = prompt.lower()
        model_name = response_model.__name__.lower()

        # Build mock data dictionary tailored to the target model fields
        data = {}
        for field_name, field_info in response_model.model_fields.items():
            field_type = field_info.annotation

            # Handle common field names
            if "rationale" in field_name or "explanation" in field_name or "summary" in field_name:
                data[field_name] = self.generate_text(prompt, system_prompt)
            elif "pattern" in field_name:
                if "card_testing" in lower:
                    data[field_name] = "card_testing"
                elif "device" in lower:
                    data[field_name] = "cnp_new_device"
                elif "region" in lower or "geo" in lower:
                    data[field_name] = "out_of_region"
                elif "takeover" in lower:
                    data[field_name] = "account_takeover"
                elif "legitimate" in lower:
                    data[field_name] = "none"
                else:
                    data[field_name] = "cnp"
            elif "uncertainty" in field_name:
                if "conflicting" in lower or "sparse" in lower or "borderline" in lower:
                    data[field_name] = "HIGH"
                elif "moderate" in lower:
                    data[field_name] = "MEDIUM"
                else:
                    data[field_name] = "LOW"
            elif "verdict" in field_name:
                if "legitimate" in lower:
                    data[field_name] = "LEGITIMATE"
                elif "uncertain" in lower:
                    data[field_name] = "UNCERTAIN"
                else:
                    data[field_name] = "FRAUD"
            elif "probability" in field_name or "score" in field_name or "confidence" in field_name:
                data[field_name] = 0.88 if "fraud" in lower else 0.15
            elif "reason" in field_name or "details" in field_name:
                data[field_name] = "Deterministic evidence evaluation matched signature pattern."
            elif field_type == list or getattr(field_type, "__origin__", None) == list:
                data[field_name] = []
            elif field_type == int:
                data[field_name] = 1
            elif field_type == float:
                data[field_name] = 0.85
            elif field_type == bool:
                data[field_name] = True
            elif field_type == str:
                data[field_name] = "Mock evaluation completed."
            else:
                data[field_name] = None

        return response_model.model_validate(data)
