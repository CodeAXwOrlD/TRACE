"""SSE Investigation Events Schema.

Provides structured, serializable events matching Section 13 of the handoff
and the frontend streaming consumer (hooks/useInvestigationStream.ts).
"""

from datetime import datetime, timezone
import json
from typing import Any, Dict
from pydantic import BaseModel, Field


class InvestigationEvent(BaseModel):
    """Structured real-time event emitted during investigation workflow."""

    type: str = Field(
        ...,
        description="Event type (e.g. 'investigation_started', 'evidence_found', 'policy_selected').",
    )
    data: Dict[str, Any] = Field(
        default_factory=dict,
        description="JSON-serializable event payload data.",
    )
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="UTC timestamp of the event.",
    )

    def to_sse_str(self) -> str:
        """Format as Server-Sent Event wire string."""
        payload = json.dumps({"type": self.type, "data": self.data, "timestamp": self.timestamp})
        return f"event: {self.type}\ndata: {payload}\n\n"
