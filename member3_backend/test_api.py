from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["api"] == "ok"
    assert data["graph"] == "mocked"
    print("GET /api/health - Passed")

def test_investigate():
    response = client.post("/api/investigate", json={"transaction_id": "txn_123"})
    assert response.status_code == 200
    data = response.json()
    assert "investigation_id" in data
    assert data["status"] == "running"
    print("POST /api/investigate - Passed")

def test_graph():
    response = client.get("/api/graph/case_123")
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "edges" in data
    print("GET /api/graph/{case_id} - Passed")

def test_cases():
    response = client.get("/api/cases")
    assert response.status_code == 200
    assert response.json() == []
    print("GET /api/cases - Passed")

    response = client.get("/api/cases/123")
    assert response.status_code == 404
    print("GET /api/cases/{id} - Passed (404 Not Found as expected)")

if __name__ == "__main__":
    print("Running tests...")
    test_health()
    test_investigate()
    test_graph()
    test_cases()
    print("All basic endpoint tests passed successfully!")
