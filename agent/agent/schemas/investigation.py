"""Investigation Contracts Schema for TRACE Agent.

Single source of truth matching frontend/lib/contracts.ts and PRD.md §9.
Ensures seamless end-to-end integration without frontend changes.
"""

from typing import List, Literal, Optional
from pydantic import BaseModel, Field
from agent.schemas.evidence import EvidenceItem

VerdictContract = Literal["FRAUD", "LEGITIMATE", "UNCERTAIN"]
UncertaintyContract = Literal["LOW", "MEDIUM", "HIGH"]
FraudPatternContract = Literal[
    "card_testing",
    "cnp",
    "cnp_new_device",
    "out_of_region",
    "account_takeover",
    "undocumented",
    "none",
]


class SimilarCaseContract(BaseModel):
    """Historical case match matching frontend SimilarCaseContract."""

    case_id: str = Field(..., description="ID of the historical case.")
    similarity: float = Field(..., ge=0.0, le=1.0, description="Similarity score (0.0 to 1.0).")
    outcome: Literal["fraud", "cleared", "confirmed_fraud"] = Field(
        ..., description="Final outcome of the historical case."
    )
    reason: Optional[str] = Field(None, description="Short explanation of why this case is similar.")


class InvestigationContract(BaseModel):
    """PRD §9 / Member 2 Final Output Contract."""

    case_id: str = Field(..., description="Unique case identifier.")
    transaction_id: str = Field(..., description="ID of the trigger transaction.")
    card_id: str = Field(..., description="Card token or identifier.")
    customer_id: str = Field(default="", description="Customer account identifier.")
    verdict: VerdictContract = Field(..., description="Final triage decision.")
    fraud_probability: float = Field(
        ..., ge=0.0, le=1.0, description="Synthesized fraud probability score."
    )
    uncertainty: UncertaintyContract = Field(
        ..., description="System confidence/uncertainty level."
    )
    pattern: FraudPatternContract = Field(
        ..., description="Classified fraud typology pattern."
    )
    first_suspicious_txn_id: Optional[str] = Field(
        None, description="Earliest transaction in the fraudulent episode chain."
    )
    episode_txn_ids: List[str] = Field(
        default_factory=list,
        description="All transaction IDs comprising the suspicious episode.",
    )
    connected_card_ids: List[str] = Field(
        default_factory=list,
        description="Cards connected via shared device, IP, or customer cluster.",
    )
    similar_cases: List[SimilarCaseContract] = Field(
        default_factory=list,
        description="Top matching historical closed cases.",
    )
    evidence: List[EvidenceItem] = Field(
        default_factory=list,
        description="Structured, defensible audit evidence chain.",
    )
    policy: str = Field(
        ..., description="Matched policy rule identifier (e.g. 'R6')."
    )
    next_actions: List[str] = Field(
        default_factory=list,
        description="Prescribed next actions for analysts or automated systems.",
    )
    exposure_usd: float = Field(
        default=0.0,
        ge=0.0,
        description="Cumulative financial exposure calculated across the episode.",
    )
    rationale: str = Field(
        ..., description="Defensible analyst-facing investigation rationale."
    )
