from pydantic import BaseModel
from typing import Optional, Any

class AgentEvent(BaseModel):
    id: str
    type: str  # "investigation_started" | "evidence_found" | "graph_update" | "risk_update" | "agent_message" | "investigation_complete"
    timestamp: str
    status: str  # "pending" | "active" | "done"
    description: str
    data: Optional[Any] = None
