from pydantic import BaseModel
from typing import List, Optional
from .core import Transaction, EvidenceItem, RiskAssessment, PolicyDecision, FraudPattern, Verdict

class SimilarCase(BaseModel):
    caseId: str
    similarity: float
    outcome: str

class Investigation(BaseModel):
    id: str
    caseId: str
    triggerTransactionId: str
    cardId: Optional[str] = None
    customerId: str
    status: str  # "queued" | "running" | "complete"
    pattern: Optional[FraudPattern] = None
    risk: RiskAssessment
    policy: Optional[PolicyDecision] = None
    evidence: List[EvidenceItem]
    timeline: List[Transaction]
    rationale: str
    createdAt: str
    firstSuspiciousTxnId: Optional[str] = None
    episodeTxnIds: Optional[List[str]] = None
    connectedCardIds: Optional[List[str]] = None
    similarCases: Optional[List[SimilarCase]] = None
    exposureUsd: Optional[float] = None

class InvestigationRequest(BaseModel):
    transaction_id: str

class InvestigationResponse(BaseModel):
    investigation_id: str
    status: str
