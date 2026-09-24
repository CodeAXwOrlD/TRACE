from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse
import asyncio
from datetime import datetime
import json

from ..schemas.investigation import InvestigationRequest, InvestigationResponse

router = APIRouter()

@router.post("/investigate", response_model=InvestigationResponse)
async def start_investigation(request: InvestigationRequest):
    # Create mock investigation ID
    return InvestigationResponse(
        investigation_id=f"inv_{request.transaction_id}",
        status="running"
    )

@router.get("/investigate/stream")
async def investigate_stream(request: Request, transaction_id: str):
    async def event_generator():
        events = [
            "investigation_started",
            "transaction_loaded",
            "history_loaded",
            "graph_analysis_started",
            "graph_analysis_complete",
            "evidence_found",
            "pattern_detected",
            "historical_cases_found",
            "risk_calculated",
            "policy_selected",
            "investigation_complete"
        ]
        for event in events:
            if await request.is_disconnected():
                break
            
            data = {
                "id": f"evt_{event}",
                "type": event,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "status": "done" if event == "investigation_complete" else "active",
                "description": f"Processing {event}"
            }
            yield {
                "event": "message",
                "data": json.dumps(data)
            }
            await asyncio.sleep(1)  # Mock delay

    return EventSourceResponse(event_generator())
