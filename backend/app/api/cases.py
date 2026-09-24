"""Cases and workbench API router for TRACE.

Handles case retrieval, evidence addition with real-time recalculation,
case closure, and dashboard statistics.
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from agent.runner import InvestigationRunner
from ..data.dataset_loader import (
    list_cases,
    get_case,
    get_dashboard_stats,
    build_initial_state_for_case,
)

router = APIRouter()
runner = InvestigationRunner()


@router.get("/cases")
async def get_all_cases() -> List[Dict[str, Any]]:
    """Return all 20 real benchmark cases matching frontend Case interface."""
    return list_cases()


@router.get("/cases/{id}")
async def get_case_by_id(id: str) -> Dict[str, Any]:
    """Return single case details from real dataset."""
    case = get_case(id)
    if not case:
        raise HTTPException(status_code=404, detail="CASE_NOT_FOUND")
    return case


@router.get("/cases/{id}/evidence")
async def get_case_evidence(id: str) -> List[Dict[str, Any]]:
    """Return structured evidence items for a real benchmark case."""
    case = get_case(id)
    if not case:
        raise HTTPException(status_code=404, detail="CASE_NOT_FOUND")

    initial_state = build_initial_state_for_case(case["id"])
    if not initial_state:
        raise HTTPException(status_code=404, detail="CASE_NOT_FOUND")

    contract = runner.run(initial_state)
    return [e.model_dump() for e in contract.evidence]


@router.post("/cases/{id}/evidence")
async def add_case_evidence(id: str, payload: Dict[str, Any]):
    """Add user/analyst evidence to a real case and recalibrate risk.

    Returns: Updated InvestigationContract matching frontend contracts.ts.
    """
    case = get_case(id)
    if not case:
        raise HTTPException(status_code=404, detail="CASE_NOT_FOUND")

    initial_state = build_initial_state_for_case(case["id"])
    if not initial_state:
        raise HTTPException(status_code=404, detail="CASE_NOT_FOUND")

    # Convert frontend evidence contract to agent EvidenceItem format
    new_evidence = {
        "step": payload.get("step", "analyst_finding"),
        "finding": payload.get("finding", "Manual analyst evidence added"),
        "direction": payload.get("direction", "concern"),
        "weight": float(payload.get("weight", 0.8)),
    }
    initial_state.setdefault("evidence", []).append(new_evidence)

    # Re-run real investigation with new evidence
    contract = runner.run(initial_state)
    return contract.model_dump()


@router.post("/cases/{id}/close")
async def close_case(id: str, payload: Optional[Dict[str, Any]] = None):
    """Close an investigation case with resolution verdict."""
    case = get_case(id)
    if not case:
        raise HTTPException(status_code=404, detail="CASE_NOT_FOUND")

    case["updatedAt"] = datetime.now(timezone.utc).isoformat()
    if payload and "verdict" in payload:
        case["verdict"] = payload["verdict"]

    return {"success": True, "message": f"Case {id} successfully closed."}


@router.get("/dashboard/stats")
async def get_stats() -> Dict[str, Any]:
    """Return executive dashboard metrics computed dynamically from real dataset."""
    return get_dashboard_stats()
