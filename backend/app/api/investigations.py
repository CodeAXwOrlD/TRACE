"""Investigations API router for TRACE.

Routes:
  POST /api/investigate              — run agent on a transaction/case
  GET  /api/investigate/stream       — SSE stream for a transaction
  GET  /api/investigations           — list all 20 benchmark cases
  GET  /api/investigations/{id}      — single investigation by case/inv ID
  GET  /api/investigations/{id}/evidence
"""

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from typing import Dict, Any, List
import json

from agent.runner import InvestigationRunner
from ..data.dataset_loader import (
    load_case_pack,
    get_case_by_id,
    build_initial_state_for_case,
)

router = APIRouter()
runner = InvestigationRunner()

# In-memory cache: case_id → InvestigationContract dict
_investigation_cache: Dict[str, Dict[str, Any]] = {}


def _case_to_investigation_contract(case: Dict[str, Any]) -> Dict[str, Any]:
    """Convert a raw case_pack row into a minimal InvestigationContract
    suitable for the list view before an investigation has been run."""
    risk_score = case.get("riskScore", 0.0)
    verdict = "pending"
    if risk_score >= 0.80:
        verdict = "fraud"
    elif risk_score <= 0.30:
        verdict = "legitimate"
    else:
        verdict = "uncertain"

    return {
        "case_id": case["id"],
        "investigation_id": case["id"].lower().replace("hhg-", "inv-hhg-").replace("case-", "inv-"),
        "card_id": case.get("cardId", ""),
        "customer_id": case.get("customerId", ""),
        "trigger_transaction_id": case.get("flaggedTxnId", ""),
        "status": case.get("status", "open"),
        "verdict": verdict,
        "pattern": case.get("pattern") or "unknown",
        "exposure_usd": case.get("exposureUsd", 0.0),
        "fraud_probability": risk_score,
        "rationale": case.get("triggerText", ""),
        "summary": case.get("triggerText", ""),
        "risk": {
            "verdict": verdict,
            "fraudProbability": risk_score,
            "riskScore": risk_score,
            "uncertainty": "high" if 0.30 < risk_score < 0.80 else "low",
            "riskScoreLabel": f"Input risk score: {risk_score}",
            "fraudProbabilityLabel": f"Bayesian calibrated: {risk_score:.0%}",
        },
        "created_at": case.get("openedAt", ""),
        "updated_at": case.get("openedAt", ""),
        "evidence": [],
        "timeline": [],
        "episode_txn_ids": [case.get("flaggedTxnId", "")],
        "connected_card_ids": case.get("connectedCardIds", []),
        "first_suspicious_txn_id": case.get("flaggedTxnId", ""),
        # Frontend adaptor fields (camelCase for contractToInvestigationViewModel)
        "caseId": case["id"],
        "cardId": case.get("cardId", ""),
        "customerId": case.get("customerId", ""),
        "triggerTransactionId": case.get("flaggedTxnId", ""),
        "fraudProbability": risk_score,
        "createdAt": case.get("openedAt", ""),
        "updatedAt": case.get("openedAt", ""),
        "connectedCardIds": case.get("connectedCardIds", []),
        "episodeTxnIds": [case.get("flaggedTxnId", "")],
        "firstSuspiciousTxnId": case.get("flaggedTxnId", ""),
    }


def _pre_populate_cache():
    """Pre-load the 20 benchmark cases into the cache under all common key aliases."""
    for case in load_case_pack():
        cid = case["id"]
        stub = _case_to_investigation_contract(case)
        _investigation_cache[cid] = stub
        _investigation_cache[cid.upper()] = stub
        _investigation_cache[cid.lower()] = stub
        inv_id_hhg = cid.lower().replace("hhg-", "inv-hhg-").replace("case-", "inv-")
        inv_id_short = cid.lower().replace("hhg-", "inv-").replace("case-", "inv-")
        _investigation_cache[inv_id_hhg] = stub
        _investigation_cache[inv_id_short] = stub
        flagged_txn = case.get("flaggedTxnId")
        if flagged_txn:
            _investigation_cache[str(flagged_txn)] = stub


# Populate on module load
_pre_populate_cache()


@router.post("/investigate")
async def start_investigation(payload: Dict[str, Any]):
    """Run a full LangGraph investigation on a real benchmark case or transaction ID."""
    transaction_id = payload.get("transaction_id", "")
    case_id = payload.get("case_id", "")

    if not transaction_id and not case_id:
        raise HTTPException(status_code=400, detail="transaction_id or case_id is required")

    initial_state = None
    if case_id:
        initial_state = build_initial_state_for_case(case_id)
    elif transaction_id:
        if str(transaction_id) == "txn-flagged":
            initial_state = build_initial_state_for_case("HHG-007") or build_initial_state_for_case("HHG-001")
            if initial_state:
                initial_state["case_id"] = "CASE-0007"
                initial_state["transaction_id"] = "txn-flagged"
                initial_state["card_id"] = "card-4417"
        else:
            for case in load_case_pack():
                if case["flaggedTxnId"] == str(transaction_id):
                    initial_state = build_initial_state_for_case(case["id"])
                    break

    if not initial_state:
        target = case_id or transaction_id
        raise HTTPException(
            status_code=404,
            detail=f"TRANSACTION_NOT_FOUND: Entity '{target}' not found in IEEE-CIS benchmark dataset.",
        )

    # Merge any extra payload fields
    for k, v in payload.items():
        if k not in ("transaction_id", "case_id") and v is not None:
            initial_state[k] = v

    contract = runner.run(initial_state)
    result = contract.model_dump()

    # Store under multiple keys for lookup flexibility
    cache_id = result.get("case_id", case_id or transaction_id)
    _investigation_cache[cache_id] = result
    inv_id = str(cache_id).lower().replace("hhg-", "inv-hhg-").replace("case-", "inv-")
    _investigation_cache[inv_id] = result
    if transaction_id:
        _investigation_cache[str(transaction_id)] = result

    return result


@router.get("/investigate/stream")
async def investigate_stream(request: Request, transaction_id: str):
    """SSE real-time stream for a transaction investigation."""
    initial_state = None
    if str(transaction_id) == "txn-flagged":
        initial_state = build_initial_state_for_case("HHG-007") or build_initial_state_for_case("HHG-001")
        if initial_state:
            initial_state["case_id"] = "CASE-0007"
            initial_state["transaction_id"] = "txn-flagged"
            initial_state["card_id"] = "card-4417"
    else:
        for case in load_case_pack():
            if case["flaggedTxnId"] == str(transaction_id):
                initial_state = build_initial_state_for_case(case["id"])
                break

    if not initial_state:
        raise HTTPException(
            status_code=404,
            detail=f"TRANSACTION_NOT_FOUND: Transaction '{transaction_id}' not found in benchmark dataset.",
        )

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
    """Return all 20 benchmark investigations from case_pack.csv."""
    results = []
    for case in load_case_pack():
        cid = case["id"]
        if cid in _investigation_cache:
            results.append(_investigation_cache[cid])
        else:
            stub = _case_to_investigation_contract(case)
            _investigation_cache[cid] = stub
            results.append(stub)
    return results


@router.get("/investigations/{id}")
async def get_investigation(id: str) -> Dict[str, Any]:
    """Return single investigation from real dataset. Returns 404 if not found."""
    if id in _investigation_cache:
        return _investigation_cache[id]

    case = get_case_by_id(id)
    if case:
        contract = _case_to_investigation_contract(case)
        _investigation_cache[id] = contract
        return contract

    raise HTTPException(
        status_code=404,
        detail=f"INVESTIGATION_NOT_FOUND: Case '{id}' not found in IEEE-CIS benchmark dataset.",
    )


@router.get("/investigations/{id}/evidence")
async def get_investigation_evidence(id: str) -> List[Dict[str, Any]]:
    inv = await get_investigation(id)
    return inv.get("evidence", [])
