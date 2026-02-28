import uuid

import pytest
from fastapi import HTTPException

from app.services.auth_service import create_access_token, create_refresh_token


def test_get_current_user_rejects_missing_token():
    """Middleware should raise 401 when no token is provided."""
    from app.middleware.auth import _validate_token

    with pytest.raises(HTTPException) as exc_info:
        _validate_token(None)
    assert exc_info.value.status_code == 401


def test_get_current_user_rejects_invalid_token():
    """Middleware should raise 401 when token is invalid."""
    from app.middleware.auth import _validate_token

    with pytest.raises(HTTPException) as exc_info:
        _validate_token("invalid.token.here")
    assert exc_info.value.status_code == 401


def test_validate_token_accepts_valid_access_token():
    """Middleware should decode a valid access token."""
    from app.middleware.auth import _validate_token

    user_id = str(uuid.uuid4())
    token = create_access_token(user_id, "admin")
    payload = _validate_token(token)
    assert payload["sub"] == user_id
    assert payload["role"] == "admin"


def test_validate_token_rejects_refresh_token():
    """Middleware should reject refresh tokens used as access tokens."""
    from app.middleware.auth import _validate_token

    token = create_refresh_token(str(uuid.uuid4()))
    with pytest.raises(HTTPException) as exc_info:
        _validate_token(token)
    assert exc_info.value.status_code == 401
