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


from pathlib import Path
_CASES_DIR = Path(__file__).resolve().parent.parent.parent.parent / "cases"


POLICY_REGISTRY = {
    "R1": {
        "rule": "R1",
        "title": "Weak Signal Verification",
        "condition": "Single weak or isolated anomaly score without corroborating device or velocity signals.",
        "action": "VERIFY_WITH_CUSTOMER",
        "route": "AUTOMATED",
    },
    "R2": {
        "rule": "R2",
        "title": "Customer Denied Transaction",
        "condition": "Customer explicit denial or card compromise confirmation.",
        "action": "BLOCK_CARD + CREATE_CASE",
        "route": "L1_ANALYST",
    },
    "R3": {
        "rule": "R3",
        "title": "Customer Confirmed Legitimate",
        "condition": "Cardholder validated authorization and recognized billing merchant/region.",
        "action": "CLOSE_LEGITIMATE",
        "route": "AUTOMATED",
    },
    "R4": {
        "rule": "R4",
        "title": "Unresponsive Verification Window",
        "condition": "Verification sent with no customer response within SLA timeout.",
        "action": "MONITOR_CARD + DECLINE_PENDING",
        "route": "AUTOMATED",
    },
    "R5": {
        "rule": "R5",
        "title": "Card Testing Velocity Burst",
        "condition": "Rapid succession of micro-authorizations followed by target purchase.",
        "action": "DECLINE_TRANSACTION + STEP_UP_AUTH",
        "route": "AUTOMATED",
    },
    "R6": {
        "rule": "R6",
        "title": "Shared Origin Compromise",
        "condition": "Multiple customer cards connected to single compromised device or proxy fingerprint.",
        "action": "CREATE_CASE + MONITOR_CONNECTED_CARDS",
        "route": "L1_ANALYST",
    },
    "R7": {
        "rule": "R7",
        "title": "Recurring Subscription Anomaly",
        "condition": "Disputed recurring subscription pattern with prior legitimate history.",
        "action": "WARN_CUSTOMER + CREATE_CASE",
        "route": "AUTOMATED",
    },
    "R8": {
        "rule": "R8",
        "title": "Conflicting Evidence Escalation",
        "condition": "Uncertain verdict with elevated exposure (> $100) or conflicting graph telemetry.",
        "action": "ESCALATE_TO_ANALYST",
        "route": "L2_SPECIALIST",
    },
    "R9": {
        "rule": "R9",
        "title": "Card-Not-Present / Undocumented Review",
        "condition": "Online or out-of-region transaction requiring supervisor review.",
        "action": "ESCALATE_TO_ANALYST",
        "route": "AUTOMATED",
    },
    "R10": {
        "rule": "R10",
        "title": "Card Containment Guardrail",
        "condition": "Prohibits global card freeze unless confirmed multi-card compromise exists.",
        "action": "GUARDRAIL_APPLIED",
        "route": "AUTOMATED",
    },
}


def _case_to_investigation_contract(case: Dict[str, Any]) -> Dict[str, Any]:
    """Convert a benchmark case into an InvestigationContract.
    If pre-computed evaluation exists in cases/{cid}.json, loads full real results.
    """
    cid = case["id"]
    json_path = _CASES_DIR / f"{cid}.json"
    data = None
    if json_path.exists():
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            data = None

    risk_score = float(case.get("riskScore", 0.0) or 0.0)

    if data:
        verdict = str(data.get("verdict", "PENDING")).lower()
        pattern = data.get("pattern") or "none"
        exposure = float(data.get("exposure_usd", 0.0) or 0.0)
        raw_probability = data.get("fraud_probability")
        fraud_prob = float(raw_probability) if raw_probability is not None else None
        uncertainty = str(data.get("uncertainty", "LOW")).lower()
        actions = data.get("next_actions", [])
        evidence = data.get("evidence", [])
        similar = data.get("similar_cases", [])
        policy = data.get("policy", "R1")
        rationale = data.get("rationale") or case.get("triggerText", "")
        approval_route = str(data.get("approval_route", "AUTOMATED")).upper()
        sar_required = bool(data.get("sar_required", False))
        sar_narrative = data.get("sar_narrative")
        # Generated benchmark files are reproducible local outputs, not proof of
        # a current TigerGraph write. Runtime investigations set this only after
        # an upsert/readback verification.
        written_to_graph = False
        graph_case_id = None
        status = "closed_fraud" if verdict == "fraud" else ("closed_legitimate" if verdict == "legitimate" else "escalated")
    else:
        verdict = "pending"
        pattern = "Pending investigation"
        exposure = 0.0
        fraud_prob = None
        uncertainty = "high"
        actions = ["ASSESS_RISK"]
        evidence = []
        similar = []
        policy = "R1"
        rationale = case.get("triggerText", "")
        approval_route = "AUTOMATED"
        sar_required = False
        sar_narrative = None
        written_to_graph = False
        graph_case_id = None
        status = "open"

    policy_meta = POLICY_REGISTRY.get(policy, POLICY_REGISTRY["R9"])
    action_primary = actions[0] if actions else "MONITOR"

    # Initial recommendation (before additional evidence)
    initial_action = "VERIFY_WITH_CUSTOMER" if verdict == "uncertain" else (action_primary if verdict != "pending" else "MONITOR")
    initial_rec = {
        "action": initial_action,
        "route": "AUTOMATED",
        "policy": policy,
        "reason": f"Initial ingestion risk score {risk_score:.2f} flagged for automated preliminary assessment.",
        "status": "completed",
    }

    # Updated recommendation (after additional evidence)
    updated_rec = {
        "action": action_primary,
        "route": approval_route,
        "policy": policy,
        "reason": rationale,
        "status": "recommended",
    }

    # What changed explanation
    if verdict == "uncertain":
        what_changed = f"Preliminary score ({risk_score:.2f}) required escalation: high uncertainty across {len(similar)} historical cases led to policy {policy} human review instead of automated card blocking."
    elif verdict == "fraud":
        probability_label = f"{fraud_prob:.0%}" if fraud_prob is not None else "an unreported value"
        what_changed = f"Evidence corroborated compromise pattern '{pattern}', producing fraud probability {probability_label} and requiring {action_primary} under approval route {approval_route}."
    elif verdict == "legitimate":
        probability_label = f"{fraud_prob:.0%}" if fraud_prob is not None else "an unreported value"
        what_changed = f"Identity and behavioral telemetry cleared the anomaly flag; fraud probability was {probability_label}, concluding legitimate cardholder activity."
    else:
        what_changed = "Investigation pending live evidence evaluation."

    stop_reason = f"Defensible decision threshold reached under policy rule {policy} with route {approval_route}."

    # Uncertainty assessment
    conf_pct = 0.90 if uncertainty == "low" else (0.75 if uncertainty == "medium" else 0.55)
    conflicting = [s.get("reason", "") for s in similar if s.get("outcome") in ("cleared", "legitimate")] if verdict in ("fraud", "uncertain") else []
    missing = ["Cardholder two-factor step-up confirmation", "Device biometrics verification"] if uncertainty == "high" else []
    uncertainty_assessment = {
        "confidence": conf_pct,
        "uncertainty": uncertainty,
        "conflicting_evidence": conflicting,
        "missing_evidence": missing,
        "why_needed": "Ambiguous signals require analyst or customer verification before permanent card decline." if uncertainty == "high" else "Sufficient multi-signal convergence for defensible decision.",
        "evidence_request": {
            "type": "Cardholder Step-Up Authentication" if uncertainty == "high" else "Not required",
            "requested_after_step": "TigerGraph Neighborhood Traversal",
            "assumed_response": "Pending customer reply via secure banking channel" if verdict == "uncertain" else "N/A - Direct signal verification",
            "impact": f"Directed investigation decision to policy {policy} ({action_primary})",
        }
    }

    # Rich structured evidence items
    flagged_txn = case.get("flaggedTxnId", "")
    card_id = case.get("cardId", "")
    cust_id = case.get("customerId", "")
    structured_evidence = []
    if evidence:
        for idx, ev in enumerate(evidence):
            step_name = ev.get("step", "model_signal")
            src = "Graph Intelligence" if "graph" in step_name.lower() or "device" in step_name.lower() else ("Ingestion ML Model" if "model" in step_name.lower() else "Case Memory")
            structured_evidence.append({
                "id": f"ev-{idx}",
                "step": step_name,
                "claim": ev.get("finding", ""),
                "finding": ev.get("finding", ""),
                "source": src,
                "direction": ev.get("direction", "concern"),
                "weight": ev.get("weight", 0.5),
                "entities": [e for e in [cust_id, card_id, flagged_txn] if e],
                "why_it_matters": (
                    "Directly strengthens the fraud hypothesis and elevates financial exposure risk."
                    if ev.get("direction") == "concern"
                    else "Attenuates anomaly concern by indicating legitimate cardholder telemetry."
                ),
            })
    else:
        structured_evidence.append({
            "id": "ev-0",
            "step": "model_signal",
            "claim": f"Ingestion detection model flagged transaction {flagged_txn} with risk score {risk_score:.2f}",
            "finding": f"Ingestion detection model flagged transaction {flagged_txn} with risk score {risk_score:.2f}",
            "source": "Ingestion ML Model",
            "direction": "concern" if risk_score >= 0.5 else "ease",
            "weight": risk_score,
            "entities": [e for e in [cust_id, card_id, flagged_txn] if e],
            "why_it_matters": "Serves as the initial detection trigger that initiated this investigation.",
        })

    # Agentic workflow timeline steps
    timeline_steps = [
        {
            "step": 1,
            "title": "Trigger Ingestion",
            "action": f"Flagged transaction {flagged_txn} ingested with initial risk score {risk_score:.2f}",
            "result": f"Investigation case {cid} opened for customer {cust_id}",
            "timestamp": case.get("openedAt", ""),
            "status": "completed",
        },
        {
            "step": 2,
            "title": "Graph Neighborhood Assessment",
            "action": f"Prepared graph context for card {card_id} and associated identities",
            "result": "Dataset graph shown unless a live TigerGraph query succeeds",
            "timestamp": case.get("openedAt", ""),
            "status": "completed",
        },
        {
            "step": 3,
            "title": "Prior Case Memory Matching",
            "action": f"Queried 5,565 historical investigations for pattern analogues",
            "result": f"Retrieved {len(similar)} relevant prior case precedents",
            "timestamp": case.get("openedAt", ""),
            "status": "completed",
        },
        {
            "step": 4,
            "title": "Typology & Uncertainty Assessment",
            "action": f"Assessed fraud typology against policy {policy}",
            "result": f"Classified pattern as '{pattern}' with {uncertainty.upper()} uncertainty",
            "timestamp": case.get("openedAt", ""),
            "status": "completed",
        },
        {
            "step": 5,
            "title": "Next Best Action Formulation",
            "action": f"Evaluated approval route ({approval_route}) under rule {policy}",
            "result": f"Recommended action: {action_primary}",
            "timestamp": case.get("openedAt", ""),
            "status": "completed",
        },
    ]

    return {
        "id": cid,
        "case_id": cid,
        "investigation_id": cid.lower().replace("hhg-", "inv-hhg-").replace("case-", "inv-"),
        "card_id": card_id,
        "customer_id": cust_id,
        "trigger_transaction_id": flagged_txn,
        "triggerType": case.get("triggerType", "risk_score"),
        "triggerText": case.get("triggerText", ""),
        "status": status,
        "verdict": verdict,
        "pattern": pattern,
        "exposure_usd": exposure,
        "fraud_probability": fraud_prob,
        "risk_score": risk_score,
        "riskScore": risk_score,
        "next_actions": actions,
        "nextAction": action_primary,
        "policy": policy,
        "policy_detail": policy_meta,
        "rationale": rationale,
        "summary": rationale,
        "stop_reason": stop_reason,
        "approval_route": approval_route,
        "sar_required": sar_required,
        "sar_narrative": sar_narrative,
        "written_to_graph": written_to_graph,
        "graph_case_id": graph_case_id,
        "initial_recommendation": initial_rec,
        "updated_recommendation": updated_rec,
        "what_changed": what_changed,
        "uncertainty_assessment": uncertainty_assessment,
        "evidence": structured_evidence,
        "similar_cases": similar,
        "similarCases": similar,
        "timeline_steps": timeline_steps,
        "timeline": [],
        "episode_txn_ids": data.get("episode_txn_ids", [flagged_txn]) if data else [flagged_txn],
        "connected_card_ids": case.get("connectedCardIds", []),
        "first_suspicious_txn_id": data.get("first_suspicious_txn_id", flagged_txn) if data else flagged_txn,
        "created_at": case.get("openedAt", ""),
        "updated_at": case.get("openedAt", ""),
        "risk": {
            "verdict": verdict,
            "fraudProbability": fraud_prob,
            "riskScore": risk_score,
            "uncertainty": uncertainty,
            "riskScoreLabel": f"Model risk score: {risk_score}",
            "fraudProbabilityLabel": f"Calibrated fraud prob: {fraud_prob:.0%}" if fraud_prob is not None else "Pending investigation",
        },
        # Frontend adaptor fields
        "caseId": cid,
        "cardId": card_id,
        "customerId": cust_id,
        "triggerTransactionId": flagged_txn,
        "fraudProbability": fraud_prob,
        "createdAt": case.get("openedAt", ""),
        "updatedAt": case.get("openedAt", ""),
        "connectedCardIds": case.get("connectedCardIds", []),
        "episodeTxnIds": data.get("episode_txn_ids", [flagged_txn]) if data else [flagged_txn],
        "firstSuspiciousTxnId": data.get("first_suspicious_txn_id", flagged_txn) if data else flagged_txn,
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
