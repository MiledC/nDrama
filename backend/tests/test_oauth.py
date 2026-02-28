from fastapi.testclient import TestClient

from app.main import app


def test_google_login_endpoint_exists():
    """Google login endpoint should exist and be accessible."""
    client = TestClient(app)
    response = client.get("/api/auth/google", follow_redirects=False)
    # When no valid Google client_id is configured, authlib may error
    # but the endpoint should exist (not 404)
    assert response.status_code != 404
