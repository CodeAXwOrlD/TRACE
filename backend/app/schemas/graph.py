from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from .core import EvidenceSeverity

class GraphNode(BaseModel):
    id: str
    type: str  # "customer" | "card" | "transaction" | "device" | "case"
    label: str
    flagged: Optional[bool] = None
    risk: Optional[EvidenceSeverity] = None
    meta: Optional[Dict[str, Any]] = None

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str

class InvestigationGraphData(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
