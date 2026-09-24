"""Investigations API router for TRACE.

Integrates Member 2 LangGraph InvestigationRunner for synchronous
investigation execution and real-time SSE streaming.
"""

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from typing import Dict, Any, List, Optional
import json

from agent.runner import InvestigationRunner
from ..data.seed_data import (
    build_initial_state_for_txn,
    list_cases,
    SEED_CASES,
    SEED_TRANSACTIONS,
)

router = APIRouter()
runner = InvestigationRunner()

# Cache of completed investigations
_investigation_cache: Dict[str, Dict[str, Any]] = {}


@router.post("/investigate")
async def start_investigation(payload: Dict[str, Any]):
    """Synchronous investigation endpoint matching frontend contracts.ts.

    Executes complete 12-node LangGraph workflow and returns InvestigationContract.
    """
    transaction_id = payload.get("transaction_id", "")
    if not transaction_id:
        raise HTTPException(status_code=400, detail="transaction_id is required")

    initial_state = build_initial_state_for_txn(transaction_id)
    # Merge any extra payload fields if provided
    for k, v in payload.items():
        if k != "transaction_id" and v is not None:
            initial_state[k] = v

    contract = runner.run(initial_state)
    result = contract.model_dump()
    _investigation_cache[contract.case_id] = result
    _investigation_cache[contract.case_id.lower().replace("case-", "inv-")] = result
    return result


@router.get("/investigate/stream")
async def investigate_stream(request: Request, transaction_id: str):
    """Real-time SSE event stream for investigation workflow.

    Streams events matching hooks/useInvestigationStream.ts and Section 13.
    """
    initial_state = build_initial_state_for_txn(transaction_id)

    async def sse_event_generator():
        async for sse_chunk in runner.stream_events(initial_state, artificial_delay=0.15):
            if await request.is_disconnected():
                break
            yield sse_chunk

    return StreamingResponse(
        sse_event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/investigations")
async def get_investigations() -> List[Dict[str, Any]]:
    """Return all investigations."""
    results = []
    for c in list_cases():
        case_id = c["id"]
        if case_id in _investigation_cache:
            results.append(_investigation_cache[case_id])
        else:
            # Generate on-demand
            txn_id = "txn-flagged" if case_id == "CASE-0007" else "txn-legit-1" if case_id == "CASE-0012" else "txn-unsure-1"
            init_state = build_initial_state_for_txn(txn_id)
            contract = runner.run(init_state)
            dump = contract.model_dump()
            _investigation_cache[case_id] = dump
            _investigation_cache[case_id.lower().replace("case-", "inv-")] = dump
            results.append(dump)
    return results


@router.get("/investigations/{id}")
async def get_investigation(id: str) -> Dict[str, Any]:
    """Return a single investigation by case_id or investigation_id."""
    if id in _investigation_cache:
        return _investigation_cache[id]

    # Map ID to trigger transaction
    txn_id = "txn-flagged"
    if "0012" in id:
        txn_id = "txn-legit-1"
    elif "0019" in id:
        txn_id = "txn-unsure-1"

    init_state = build_initial_state_for_txn(txn_id)
    contract = runner.run(init_state)
    dump = contract.model_dump()
    _investigation_cache[id] = dump
    return dump


@router.get("/investigations/{id}/evidence")
async def get_investigation_evidence(id: str) -> List[Dict[str, Any]]:
    """Return structured evidence items for an investigation."""
    inv = await get_investigation(id)
    return inv.get("evidence", [])
