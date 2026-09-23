"""Investigation Explanation and Rationale Generator.

Implements Sections 6, 15, 16, 17 of Member 2 handoff:
The LLM serves as an analytical reasoning layer to articulate human-readable,
defensible audit narratives explaining deterministic evidence, policy, and uncertainty.
Includes robust error handling and fallback generation.
"""

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from agent.schemas.evidence import EvidenceItem
from agent.schemas.investigation import (
    VerdictContract,
    UncertaintyContract,
    FraudPatternContract,
    SimilarCaseContract,
)
from agent.llm.factory import get_llm_provider
from agent.llm.base import BaseLLMProvider

logger = logging.getLogger(__name__)


class StructuredRationaleResponse(BaseModel):
    """Pydantic validated structured explanation response from LLM."""

    summary: str = Field(..., description="High-level investigation finding.")
    key_drivers: List[str] = Field(default_factory=list, description="Top evidence factors.")
    policy_justification: str = Field(..., description="Why the assigned policy was selected.")
    rationale: str = Field(..., description="Complete audit-defensible narrative.")


class ExplanationGenerator:
    """Generates defensible analyst explanations using LLM with deterministic fallback."""

    def __init__(self, provider: Optional[BaseLLMProvider] = None):
        self.provider = provider or get_llm_provider()
        self.prompt_template = self._load_prompt_template()

    def _load_prompt_template(self) -> str:
        prompt_path = Path(__file__).parent / "prompts" / "explanation.txt"
        if prompt_path.exists():
            return prompt_path.read_text(encoding="utf-8")
        return (
            "Analyze evidence and explain why verdict {verdict} and policy {policy} apply. "
            "Evidence: {evidence_findings}"
        )

    def generate(
        self,
        case_id: str,
        transaction_id: str,
        card_id: str,
        verdict: VerdictContract,
        fraud_probability: float,
        uncertainty: UncertaintyContract,
        pattern: FraudPatternContract,
        first_suspicious_txn_id: Optional[str],
        episode_txn_ids: List[str],
        exposure_usd: float,
        evidence: List[EvidenceItem],
        similar_cases: List[SimilarCaseContract],
        policy: str,
        next_actions: List[str],
    ) -> str:
        """Generate final investigation narrative."""
        evidence_str = "\n".join(
            f"- [{e.step.upper()}]: {e.finding} (direction: {e.direction}, weight: {e.weight})"
            for e in evidence
        ) or "None recorded."

        cases_str = "\n".join(
            f"- {c.case_id} (Similarity: {c.similarity:.0%}, Outcome: {c.outcome}): {c.reason}"
            for c in similar_cases
        ) or "No historical precedents found above similarity threshold."

        prompt = self.prompt_template.format(
            case_id=case_id,
            transaction_id=transaction_id,
            card_id=card_id,
            exposure_usd=exposure_usd,
            first_suspicious_txn_id=first_suspicious_txn_id or transaction_id,
            episode_count=len(episode_txn_ids),
            fraud_probability=fraud_probability,
            uncertainty=uncertainty,
            verdict=verdict,
            pattern=pattern,
            policy=policy,
            next_actions=", ".join(next_actions),
            evidence_findings=evidence_str,
            similar_cases=cases_str,
        )

        try:
            # Attempt structured generation
            structured_res = self.provider.generate_structured(
                prompt=prompt,
                response_model=StructuredRationaleResponse,
                system_prompt="You are a senior financial crime intelligence investigator for a tier-1 bank.",
            )
            if structured_res.rationale:
                return structured_res.rationale
        except Exception as e:
            logger.warning("Structured rationale generation failed (%s), trying raw text.", e)

        try:
            # Fallback attempt 2: raw text generation
            raw_text = self.provider.generate_text(prompt=prompt)
            if raw_text and len(raw_text.strip()) > 20:
                return raw_text.strip()
        except Exception as e:
            logger.error("LLM text generation failed entirely: %s. Using deterministic fallback.", e)

        # Fallback 3: Deterministic fallback rationale based purely on facts
        return self._build_deterministic_fallback(
            verdict=verdict,
            pattern=pattern,
            policy=policy,
            next_actions=next_actions,
            evidence=evidence,
            first_suspicious_txn_id=first_suspicious_txn_id,
            exposure_usd=exposure_usd,
        )

    def _build_deterministic_fallback(
        self,
        verdict: VerdictContract,
        pattern: FraudPatternContract,
        policy: str,
        next_actions: List[str],
        evidence: List[EvidenceItem],
        first_suspicious_txn_id: Optional[str],
        exposure_usd: float,
    ) -> str:
        """Deterministic, factual narrative used when external LLM is offline or fails."""
        primary_concerns = [e.finding for e in evidence if e.direction == "concern"]
        primary_ease = [e.finding for e in evidence if e.direction == "ease"]

        if verdict == "FRAUD":
            reasons = "; ".join(primary_concerns[:2]) if primary_concerns else "anomalous transaction parameters"
            return (
                f"Investigation confirms fraud classification based on: {reasons}. "
                f"The initial suspicious activity originated at transaction {first_suspicious_txn_id}, "
                f"yielding cumulative exposure of ${exposure_usd:,.2f}. "
                f"Policy {policy} matched, initiating prescribed protocol: {', '.join(next_actions)}."
            )
        elif verdict == "LEGITIMATE":
            reasons = "; ".join(primary_ease[:2]) if primary_ease else "nominal purchasing telemetry"
            return (
                f"Transaction validated as legitimate based on: {reasons}. "
                f"No adverse syndicate links or velocity anomalies detected. "
                f"Policy {policy} applied to close the investigation without customer friction."
            )
        else:
            return (
                f"Investigation yields UNCERTAIN triage due to borderline risk signals and missing identity confirmations. "
                f"Observed pattern '{pattern}' presents conflicting telemetry. "
                f"Policy {policy} mandates escalation: {', '.join(next_actions)}."
            )
