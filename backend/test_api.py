"""Automated integration tests for TRACE Backend API."""

import asyncio
import httpx
from app.main import app


class ASGIClient:
    """Small synchronous facade over httpx's async ASGI transport.

    This avoids the blocking TestClient incompatibility in the submission's
    FastAPI/Starlette/httpx dependency combination.
    """
    def request(self, method, url, **kwargs):
        async def send():
            transport = httpx.ASGITransport(app=app)
            async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as http:
                return await http.request(method, url, **kwargs)
        return asyncio.run(send())

    def get(self, url, **kwargs):
        return self.request("GET", url, **kwargs)

    def post(self, url, **kwargs):
        return self.request("POST", url, **kwargs)


client = ASGIClient()


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["fastapi"] == "online"
    assert data["agent"] == "ready"
    assert "timestamp" in data
    print("✓ GET /api/health - Passed")


def test_investigate():
    response = client.post("/api/investigate", json={"transaction_id": "3514948"})
    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] in ("FRAUD", "LEGITIMATE", "UNCERTAIN")
    assert "fraud_probability" in data
    assert "pattern" in data
    assert "evidence" in data
    assert isinstance(data["evidence"], list)
    assert len(data["evidence"]) > 0
    assert "policy" in data
    assert "next_actions" in data
    print(f"✓ POST /api/investigate - Passed (Verdict: {data['verdict']}, Pattern: {data['pattern']}, Prob: {data['fraud_probability']})")


def test_graph():
    response = client.get("/api/graph/CASE-0007")
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "edges" in data
    assert len(data["nodes"]) > 0
    assert len(data["edges"]) > 0
    print(f"✓ GET /api/graph/CASE-0007 - Passed ({len(data['nodes'])} nodes, {len(data['edges'])} edges)")


def test_cases():
    response = client.get("/api/cases")
    assert response.status_code == 200
    cases = response.json()
    assert len(cases) >= 3
    print(f"✓ GET /api/cases - Passed ({len(cases)} cases found)")

    response = client.get("/api/cases/CASE-0007")
    assert response.status_code == 200
    case = response.json()
    assert case["id"] == "CASE-0007"
    print("✓ GET /api/cases/CASE-0007 - Passed")

    ev_response = client.get("/api/cases/CASE-0007/evidence")
    assert ev_response.status_code == 200
    assert isinstance(ev_response.json(), list)
    print("✓ GET /api/cases/CASE-0007/evidence - Passed")


def test_add_evidence():
    payload = {
        "step": "manual_review",
        "finding": "Customer verified unauthorized transaction attempt",
        "direction": "concern",
        "weight": 0.95,
    }
    response = client.post("/api/cases/CASE-0007/evidence", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "verdict" in data
    assert "fraud_probability" in data
    print("✓ POST /api/cases/{id}/evidence - Passed (Recalibrated successfully)")


def test_close_case():
    response = client.post("/api/cases/CASE-0007/close", json={"verdict": "FRAUD"})
    assert response.status_code == 200
    assert response.json()["success"] is True
    print("✓ POST /api/cases/{id}/close - Passed")


def test_entities_and_stats():
    # Transaction
    res = client.get("/api/transactions/3514948")
    assert res.status_code == 200
    assert res.json()["id"] == "3514948"

    # Customer
    res = client.get("/api/customers/C09933")
    assert res.status_code == 200
    assert res.json()["id"] == "C09933"

    # Device
    res = client.get("/api/devices/dev-3583227")
    assert res.status_code == 200
    assert res.json()["id"] == "dev-3583227"

    # Dashboard Stats
    res = client.get("/api/dashboard/stats")
    assert res.status_code == 200
    stats = res.json()
    assert "activeCases" in stats
    assert "highRisk" in stats
    print("✓ GET entities and dashboard stats - Passed")


if __name__ == "__main__":
    print("\n--- Running TRACE Backend Integration Tests ---")
    test_health()
    test_investigate()
    test_graph()
    test_cases()
    test_add_evidence()
    test_close_case()
    test_entities_and_stats()
    print("\n✓ ALL TRACE Backend Integration Tests Passed Successfully!\n")
