import uuid

import pytest
from jose import jwt

from app.config import settings
from app.services.auth_service import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)


def test_hash_password_returns_bcrypt_hash():
    hashed = hash_password("mysecretpassword")
    assert hashed != "mysecretpassword"
    assert hashed.startswith("$2b$")


def test_verify_password_correct():
    hashed = hash_password("mysecretpassword")
    assert verify_password("mysecretpassword", hashed) is True


def test_verify_password_incorrect():
    hashed = hash_password("mysecretpassword")
    assert verify_password("wrongpassword", hashed) is False


def test_create_access_token_contains_claims():
    user_id = uuid.uuid4()
    token = create_access_token(str(user_id), "admin")
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])
    assert payload["sub"] == str(user_id)
    assert payload["role"] == "admin"
    assert payload["type"] == "access"
    assert "exp" in payload


def test_create_refresh_token_contains_claims():
    user_id = uuid.uuid4()
    token = create_refresh_token(str(user_id))
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])
    assert payload["sub"] == str(user_id)
    assert payload["type"] == "refresh"
    assert "exp" in payload


def test_decode_token_valid():
    user_id = uuid.uuid4()
    token = create_access_token(str(user_id), "editor")
    payload = decode_token(token)
    assert payload["sub"] == str(user_id)
    assert payload["role"] == "editor"


def test_decode_token_invalid():
    with pytest.raises(Exception):
        decode_token("invalid.token.here")
