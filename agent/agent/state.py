"""Strongly-typed Investigation State for LangGraph.

Implements Section 4 of the Member 2 handoff:
Typed state representing the active investigation context as it passes
through the LangGraph workflow pipeline.
"""

from typing import Any, Dict, List, Optional, TypedDict
from pydantic import BaseModel, Field

from agent.schemas.evidence import EvidenceItem
from agent.schemas.investigation import (
    InvestigationContract,
    SimilarCaseContract,
    VerdictContract,
    UncertaintyContract,
    FraudPatternContract,
)
from agent.schemas.events import InvestigationEvent


class InvestigationState(TypedDict, total=False):
    """LangGraph State dictionary representing current investigation execution context."""

    # Identifiers
    case_id: str
    transaction_id: str
    card_id: str

    # Core entities (facts)
    transaction: Dict[str, Any]
    customer: Dict[str, Any]
    transaction_history: List[Dict[str, Any]]

    # Graph relationships
    connected_cards: List[str]
    connected_devices: List[str]

    # Deterministic investigation results
    evidence: List[EvidenceItem]
    first_suspicious_txn_id: Optional[str]
    episode_txn_ids: List[str]
    exposure_usd: float

    # Classification & Reasoning
    pattern: FraudPatternContract
    similar_cases: List[SimilarCaseContract]
    fraud_probability: float
    uncertainty: UncertaintyContract
    verdict: VerdictContract

    # Policy & Actions
    policy: str
    next_actions: List[str]

    # Final narrative
    rationale: str
    status: str  # e.g., "INITIALIZED", "RUNNING", "COMPLETED", "ERROR"
    error_message: Optional[str]
    written_to_graph: bool
    graph_case_id: Optional[str]

    # Real-time events generated during workflow
    events: List[InvestigationEvent]


class InvestigationStateModel(BaseModel):
    """Pydantic validated model for InvestigationState."""

    case_id: str
    transaction_id: str
    card_id: str
    transaction: Dict[str, Any] = Field(default_factory=dict)
    customer: Dict[str, Any] = Field(default_factory=dict)
    transaction_history: List[Dict[str, Any]] = Field(default_factory=list)
    connected_cards: List[str] = Field(default_factory=list)
    connected_devices: List[str] = Field(default_factory=list)
    evidence: List[EvidenceItem] = Field(default_factory=list)
    first_suspicious_txn_id: Optional[str] = None
    episode_txn_ids: List[str] = Field(default_factory=list)
    exposure_usd: float = 0.0
    pattern: FraudPatternContract = "none"
    similar_cases: List[SimilarCaseContract] = Field(default_factory=list)
    fraud_probability: float = 0.0
    uncertainty: UncertaintyContract = "HIGH"
    verdict: VerdictContract = "UNCERTAIN"
    policy: str = "R9"
    next_actions: List[str] = Field(default_factory=list)
    rationale: str = ""
    status: str = "INITIALIZED"
    error_message: Optional[str] = None
    written_to_graph: bool = False
    graph_case_id: Optional[str] = None
    events: List[InvestigationEvent] = Field(default_factory=list)

    def to_contract(self) -> InvestigationContract:
        """Export to exact frontend-compatible InvestigationContract."""
        cust_id = ""
        if isinstance(self.customer, dict):
            cust_id = str(self.customer.get("id") or self.customer.get("customer_id") or "")
        elif isinstance(self.customer, str):
            cust_id = self.customer

        return InvestigationContract(
            case_id=self.case_id,
            transaction_id=self.transaction_id,
            card_id=self.card_id,
            customer_id=cust_id,
            verdict=self.verdict,
            fraud_probability=self.fraud_probability,
            uncertainty=self.uncertainty,
            pattern=self.pattern,
            first_suspicious_txn_id=self.first_suspicious_txn_id,
            episode_txn_ids=self.episode_txn_ids,
            connected_card_ids=self.connected_cards,
            similar_cases=self.similar_cases,
            evidence=self.evidence,
            policy=self.policy,
            next_actions=self.next_actions,
            exposure_usd=self.exposure_usd,
            rationale=self.rationale,
            written_to_graph=self.written_to_graph,
            graph_case_id=self.graph_case_id if self.written_to_graph else None,
            approval_route="SENIOR_ANALYST" if self.verdict == "FRAUD" and self.exposure_usd > 2000 else "AUTOMATED",
            sar_required=self.verdict == "FRAUD" and self.exposure_usd >= 2000,
            sar_narrative=f"Suspicious activity report filed for case {self.case_id} involving transaction {self.transaction_id} on card {self.card_id}. Total financial exposure: ${self.exposure_usd:.2f}." if (self.verdict == "FRAUD" and self.exposure_usd >= 2000) else None,
        )
