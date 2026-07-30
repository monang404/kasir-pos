"""Test placeholder scaffold (task 0.3) — memverifikasi CI backend berjalan."""
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_health_ok():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
