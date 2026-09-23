"""TRACE AI Agent Layer package.

Exposes InvestigationRunner, InvestigationState, schemas, and workflow.
"""

from agent.runner import InvestigationRunner
from agent.state import InvestigationState, InvestigationStateModel
from agent.graph import investigation_workflow
from agent.schemas.investigation import InvestigationContract
from agent.schemas.evidence import EvidenceItem
from agent.schemas.events import InvestigationEvent

__all__ = [
    "InvestigationRunner",
    "InvestigationState",
    "InvestigationStateModel",
    "investigation_workflow",
    "InvestigationContract",
    "EvidenceItem",
    "InvestigationEvent",
]
