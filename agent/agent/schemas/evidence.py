"""Evidence Schema for TRACE Agent.

Evidence items represent structured, non-hallucinated findings from
deterministic detectors, graph queries, history analyzers, and policy engines.
"""

from typing import Literal
from pydantic import BaseModel, Field, field_validator


EvidenceDirection = Literal["concern", "ease", "context", "support", "neutral"]


class EvidenceItem(BaseModel):
    """Structured evidence finding matching PRD section 9 & Section 5 of handoff."""

    step: str = Field(
        ...,
        description="The detector or pipeline step that produced this evidence (e.g., 'device_link', 'velocity_burst').",
    )
    finding: str = Field(
        ...,
        description="Factual, human-readable description of what was detected.",
    )
    direction: Literal["concern", "ease", "context"] = Field(
        ...,
        description="Direction of the signal: 'concern' (indicates fraud), 'ease' (indicates legitimacy), or 'context'.",
    )
    weight: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Relative strength of this evidence item (0.0 to 1.0).",
    )

    @field_validator("direction", mode="before")
    @classmethod
    def normalize_direction(cls, v: str) -> str:
        """Normalize synonyms like 'support' to 'ease', 'neutral' to 'context'."""
        val = str(v).lower().strip()
        if val in ("support", "ease", "legitimate"):
            return "ease"
        if val in ("concern", "fraud", "suspicious"):
            return "concern"
        if val in ("context", "neutral", "info"):
            return "context"
        return "context"
