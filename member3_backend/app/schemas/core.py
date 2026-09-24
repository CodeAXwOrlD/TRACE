from enum import Enum
from pydantic import BaseModel
from typing import List, Optional, Any, Dict

class Verdict(str, Enum):
    FRAUD = "FRAUD"
    LEGITIMATE = "LEGITIMATE"
    UNCERTAIN = "UNCERTAIN"
    PENDING = "PENDING"

class Uncertainty(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    NONE = "NONE"

class EvidenceTag(str, Enum):
    raises_concern = "raises_concern"
    lowers_concern = "lowers_concern"
    context = "context"

class EvidenceSeverity(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

class FraudPattern(str, Enum):
    card_testing = "card_testing"
    cnp = "cnp"
    cnp_new_device = "cnp_new_device"
    out_of_region = "out_of_region"
    account_takeover = "account_takeover"
    undocumented = "undocumented"

class Customer(BaseModel):
    id: str
    riskLevel: Uncertainty
    connectedCards: int
    transactionCount: int
    deviceCount: int
    previousCases: int

class Card(BaseModel):
    id: str
    last4: str
    customerId: str

class DeviceProfile(BaseModel):
    id: str
    deviceType: str
    deviceInfo: str
    cardsSeenOn: List[str]

class Transaction(BaseModel):
    id: str
    timestamp: str
    amount: float
    channel: str
    cardId: str
    deviceId: Optional[str] = None
    billingRegion: str
    emailDomain: str
    riskScore: float
    flagged: bool

class ClosedCase(BaseModel):
    id: str
    outcome: str
    pattern: FraudPattern
    exposureUsd: float
    analystNotes: Optional[str] = None

class EvidenceItem(BaseModel):
    id: str
    type: str  # "transaction" | "device" | "card" | "customer" | "historical_case" | "pattern"
    severity: EvidenceSeverity
    timestamp: str
    description: str
    source: str
    confidence: float
    tag: EvidenceTag

class RiskAssessment(BaseModel):
    riskScore: float
    probability: float
    uncertainty: Uncertainty
    verdict: str # from Verdict, avoiding circular ref issues if not using enum directly

class PolicyDecision(BaseModel):
    policyId: str
    actions: List[str]
