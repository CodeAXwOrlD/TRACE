from pydantic import BaseModel
from typing import Optional
from .core import Verdict

class Case(BaseModel):
    id: str
    investigationId: Optional[str] = None
    verdict: str  # Verdict or "PENDING"
    exposureUsd: float
    openedAt: str
    updatedAt: str
    summary: str

class EvidenceRequest(BaseModel):
    # Add fields based on what POST /api/cases/{id}/evidence needs
    description: str
    source: str
    type: str

class CloseCaseRequest(BaseModel):
    verdict: str
    summary: str
