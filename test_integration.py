"""TRACE End-to-End System Integration Test Suite.

Tests the full lifecycle across:
1. Agent (LangGraph Workflow Engine)
2. Backend (FastAPI Services & Data Layer)
3. Frontend Contracts & Streaming Protocols
"""

import sys
import os
import asyncio
from datetime import datetime

# Add root, agent, and backend to Python path
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(ROOT_DIR, "agent"))
sys.path.insert(0, os.path.join(ROOT_DIR, "backend"))

from fastapi.testclient import TestClient
from backend.app.main import app
from agent.runner import InvestigationRunner
from agent.state import InvestigationStateModel
from agent.schemas.investigation import InvestigationContract

client = TestClient(app)


def test_1_agent_standalone_workflow():
    print("\n[TEST 1] Testing Agent Standalone 12-Node Workflow...")
    runner = InvestigationRunner()
    initial_state = {
        "transaction_id": "txn-flagged",
        "card_id": "card-4417",
        "transaction": {
            "amount": 128.33,
            "risk_score": 0.87,
            "is_3ds_authenticated": False,
            "device_id": "DEV-8819",
        },
        "transaction_history": [
            {"id": "txn-001", "amount": 1.05, "timestamp": "2026-09-18T13:41:00Z"},
            {"id": "txn-002", "amount": 1.20, "timestamp": "2026-09-18T13:39:00Z"},
            {"id": "txn-flagged", "amount": 128.33, "timestamp": "2026-09-18T14:22:00Z"},
        ],
        "connected_cards": ["card-0921", "card-7754", "card-3308"],
        "connected_devices": ["DEV-8819"],
    }
    contract = runner.run(initial_state)
    assert isinstance(contract, InvestigationContract)
    assert contract.verdict == "FRAUD"
    assert contract.fraud_probability >= 0.80
    assert contract.pattern in ("card_testing", "cnp", "cnp_new_device")
    assert contract.policy == "R6"
    assert "BLOCK_CARD" in contract.next_actions
    assert len(contract.evidence) >= 4
    print(f"  ✓ Agent Standalone: Verdict={contract.verdict}, Prob={contract.fraud_probability}, Pattern={contract.pattern}, Policy={contract.policy}")


def test_2_backend_to_agent_rest_investigate():
    print("\n[TEST 2] Testing Backend -> Agent Synchronous REST Endpoint (POST /api/investigate)...")
    res = client.post("/api/investigate", json={"transaction_id": "txn-flagged"})
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["case_id"] == "CASE-0007"
    assert data["transaction_id"] == "txn-flagged"
    assert data["card_id"] == "card-4417"
    assert data["verdict"] in ("FRAUD", "LEGITIMATE", "UNCERTAIN")
    assert "fraud_probability" in data
    assert "pattern" in data
    assert "first_suspicious_txn_id" in data
    assert "episode_txn_ids" in data
    assert "connected_card_ids" in data
    assert "similar_cases" in data
    assert "evidence" in data
    assert "policy" in data
    assert "next_actions" in data
    assert "exposure_usd" in data
    assert "rationale" in data
    print(f"  ✓ REST Investigation successful: Case={data['case_id']}, Verdict={data['verdict']}, Exposure=${data['exposure_usd']}")


def test_3_backend_to_agent_realtime_sse_stream():
    print("\n[TEST 3] Testing Backend -> Agent SSE Stream (GET /api/investigate/stream)...")
    with client.stream("GET", "/api/investigate/stream?transaction_id=txn-flagged") as response:
        assert response.status_code == 200
        event_types_received = []
        for line in response.iter_lines():
            if line.startswith("event:"):
                etype = line.replace("event:", "").strip()
                event_types_received.append(etype)

        assert "investigation_started" in event_types_received, "Missing investigation_started event"
        assert "evidence_found" in event_types_received, "Missing evidence_found event"
        assert "pattern_detected" in event_types_received, "Missing pattern_detected event"
        assert "probability_updated" in event_types_received, "Missing probability_updated event"
        assert "policy_selected" in event_types_received, "Missing policy_selected event"
        assert "investigation_complete" in event_types_received, "Missing investigation_complete event"
        print(f"  ✓ SSE Streaming received {len(event_types_received)} events: {event_types_received[:4]} ... {event_types_received[-2:]}")


def test_4_analyst_evidence_injection_and_recalibration():
    print("\n[TEST 4] Testing Evidence Injection & Recalibration (POST /api/cases/{id}/evidence)...")
    payload = {
        "step": "manual_cardholder_contact",
        "finding": "Cardholder explicitly confirmed physical possession and authorized transaction",
        "direction": "ease",
        "weight": 0.95,
    }
    res = client.post("/api/cases/CASE-0007/evidence", json=payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert "fraud_probability" in data
    assert any("Cardholder explicitly confirmed" in e["finding"] for e in data["evidence"])
    print(f"  ✓ Evidence Injected and Recalibrated: Probability adjusted to {data['fraud_probability']}")

    # Also test GET /api/cases/{id}/evidence
    get_res = client.get("/api/cases/CASE-0007/evidence")
    assert get_res.status_code == 200
    assert isinstance(get_res.json(), list)
    assert len(get_res.json()) > 0
    print(f"  ✓ GET /api/cases/CASE-0007/evidence returned {len(get_res.json())} evidence items")


def test_5_graph_visualization_payload():
    print("\n[TEST 5] Testing Sigma.js Graph Payload (GET /api/graph/{case_id})...")
    res = client.get("/api/graph/CASE-0007")
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data and "edges" in data
    assert len(data["nodes"]) >= 5
    assert len(data["edges"]) >= 5
    node_types = {n["type"] for n in data["nodes"]}
    assert "customer" in node_types
    assert "card" in node_types
    assert "transaction" in node_types
    assert "device" in node_types
    print(f"  ✓ Graph topology validated: {len(data['nodes'])} nodes, {len(data['edges'])} edges across types {node_types}")


def test_6_system_health():
    print("\n[TEST 6] Testing Subsystem Health Check (GET /api/health)...")
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["fastapi"] == "online"
    assert data["agent"] == "ready"
    assert data["tigergraph"] in ("connected", "mock", "disconnected")
    assert data["dataset"] == "loaded"
    print(f"  ✓ Health status: {data}")


def test_7_case_and_entities_endpoints():
    print("\n[TEST 7] Testing Case Management, Entity Lookups & Dashboard Stats...")
    # List Cases
    cases = client.get("/api/cases").json()
    assert len(cases) >= 3

    # Close Case
    close_res = client.post("/api/cases/CASE-0007/close", json={"verdict": "FRAUD"})
    assert close_res.status_code == 200
    
    assert close_res.json()["success"] is True

    # Lookup Transaction
    txn = client.get("/api/transactions/txn-flagged").json()
    assert txn["amount"] == 128.33

    # Lookup Customer
    cust = client.get("/api/customers/C12382").json()
    assert cust["riskLevel"] == "HIGH"

    # Lookup Device
    dev = client.get("/api/devices/DEV-8819").json()
    assert len(dev["cardsSeenOn"]) >= 3

    # Dashboard Stats
    stats = client.get("/api/dashboard/stats").json()
    assert stats["investigations"] >= 3
    print("  ✓ Case management, entity lookups, and executive dashboard metrics fully operational.")


if __name__ == "__main__":
    print("=" * 70)
    print("      TRACE END-TO-END SYSTEM INTEGRATION TEST SUITE")
    print("=" * 70)
    test_1_agent_standalone_workflow()
    test_2_backend_to_agent_rest_investigate()
    test_3_backend_to_agent_realtime_sse_stream()
    test_4_analyst_evidence_injection_and_recalibration()
    test_5_graph_visualization_payload()
    test_6_system_health()
    test_7_case_and_entities_endpoints()
    print("=" * 70)
    print("      ALL 7 INTEGRATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)
