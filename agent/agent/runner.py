"""Investigation Runner for Synchronous and Real-Time SSE Execution.

Provides high-level execution interfaces for Member 3's FastAPI service:
1. `run(...)` -> Returns InvestigationContract for standard REST endpoints.
2. `stream_events(...)` -> Async generator yielding SSE event strings for `/api/investigate/stream`.
"""

import asyncio
from typing import Any, AsyncGenerator, Dict, List, Optional
from agent.graph import investigation_workflow
from agent.state import InvestigationState, InvestigationStateModel
from agent.schemas.investigation import InvestigationContract
from agent.schemas.events import InvestigationEvent
from agent.schemas.evidence import EvidenceItem


class InvestigationRunner:
    """Orchestrates LangGraph investigation execution and SSE streaming."""

    def __init__(self, workflow=None):
        self.workflow = workflow or investigation_workflow

    def run(self, initial_state: Dict[str, Any]) -> InvestigationContract:
        """Execute the complete LangGraph workflow synchronously.

        Returns: validated InvestigationContract matching frontend contracts.ts.
        """
        raw_evidence = initial_state.get("evidence", [])
        clean_evidence = [
            e if isinstance(e, EvidenceItem) else EvidenceItem.model_validate(e)
            for e in raw_evidence
        ]

        state_dict: InvestigationState = {
            "case_id": initial_state.get("case_id", f"case_{initial_state.get('transaction_id', 'unknown')}"),
            "transaction_id": initial_state.get("transaction_id", ""),
            "card_id": initial_state.get("card_id", ""),
            "transaction": initial_state.get("transaction", {}),
            "customer": initial_state.get("customer", {}),
            "transaction_history": initial_state.get("transaction_history", []),
            "connected_cards": initial_state.get("connected_cards", []),
            "connected_devices": initial_state.get("connected_devices", []),
            "evidence": clean_evidence,
            "events": [],
            "status": "INITIALIZED",
        }

        final_state = self.workflow.invoke(state_dict)
        model = InvestigationStateModel.model_validate(final_state)
        return model.to_contract()

    async def stream_events(
        self, initial_state: Dict[str, Any], artificial_delay: float = 0.05
    ) -> AsyncGenerator[str, None]:
        """Stream real-time SSE events matching frontend streaming contract.

        Yields strings formatted as:
        event: <type>
        data: {"type": ..., "data": ..., "timestamp": ...}

        """
        raw_evidence = initial_state.get("evidence", [])
        clean_evidence = [
            e if isinstance(e, EvidenceItem) else EvidenceItem.model_validate(e)
            for e in raw_evidence
        ]

        state_dict: InvestigationState = {
            "case_id": initial_state.get("case_id", f"case_{initial_state.get('transaction_id', 'unknown')}"),
            "transaction_id": initial_state.get("transaction_id", ""),
            "card_id": initial_state.get("card_id", ""),
            "transaction": initial_state.get("transaction", {}),
            "customer": initial_state.get("customer", {}),
            "transaction_history": initial_state.get("transaction_history", []),
            "connected_cards": initial_state.get("connected_cards", []),
            "connected_devices": initial_state.get("connected_devices", []),
            "evidence": clean_evidence,
            "events": [],
            "status": "INITIALIZED",
        }

        emitted_count = 0

        # Stream through the LangGraph node updates
        for output_chunk in self.workflow.stream(state_dict):
            # output_chunk is {node_name: {updated_state_fields}}
            for node_name, updates in output_chunk.items():
                if isinstance(updates, dict) and "events" in updates:
                    all_events: List[InvestigationEvent] = updates["events"]
                    # Emit any newly appended events
                    while emitted_count < len(all_events):
                        event = all_events[emitted_count]
                        yield event.to_sse_str()
                        emitted_count += 1
                        if artificial_delay > 0:
                            await asyncio.sleep(artificial_delay)
