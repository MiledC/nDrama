import uuid

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole


def _unique_email(label: str) -> str:
    """Return a unique email for each test invocation to avoid collisions."""
    return f"test_{label}_{uuid.uuid4().hex[:8]}@example.com"


async def _register_user(client: httpx.AsyncClient, label: str) -> tuple[str, str, str]:
    """Register a user and return (email, access_token, user_id)."""
    email = _unique_email(label)
    resp = await client.post("/api/auth/register", json={
        "email": email,
        "password": "securepassword123",
        "name": f"Test {label}",
    })
    assert resp.status_code == 201
    data = resp.json()
    access_token = data["access_token"]

    # Get user id from /me
    me_resp = await client.get("/api/auth/me", headers={
        "Authorization": f"Bearer {access_token}",
    })
    user_id = me_resp.json()["id"]
    return email, access_token, user_id


async def _make_admin(db_session: AsyncSession, user_id: str) -> None:
    """Promote a user to admin directly in the DB."""
    result = await db_session.execute(
        select(User).where(User.id == uuid.UUID(user_id))
    )
    user = result.scalar_one()
    user.role = UserRole.admin
    await db_session.commit()


async def _get_admin_token(
    client: httpx.AsyncClient, db_session: AsyncSession, label: str,
) -> tuple[str, str]:
    """Register a user, promote them to admin, re-login, and return (access_token, user_id)."""
    email, _token, user_id = await _register_user(client, label)
    await _make_admin(db_session, user_id)

    # Re-login to get a token with the admin role in the JWT
    login_resp = await client.post("/api/auth/login", json={
        "email": email,
        "password": "securepassword123",
    })
    assert login_resp.status_code == 200
    return login_resp.json()["access_token"], user_id


# --- List Users ---


async def test_list_users_as_admin(client, db_session):
    admin_token, _ = await _get_admin_token(client, db_session, "listadmin")

    response = await client.get("/api/users", headers={
        "Authorization": f"Bearer {admin_token}",
    })
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1  # At least the admin user


async def test_list_users_as_editor(client):
    _, editor_token, _ = await _register_user(client, "listeditor")

    response = await client.get("/api/users", headers={
        "Authorization": f"Bearer {editor_token}",
    })
    assert response.status_code == 403


async def test_list_users_no_auth(client):
    response = await client.get("/api/users")
    # HTTPBearer returns 403 when no credentials are provided
    assert response.status_code in (401, 403)


# --- Invite User ---


async def test_invite_user_as_admin(client, db_session):
    admin_token, _ = await _get_admin_token(client, db_session, "inviteadmin")
    invite_email = _unique_email("invited")

    response = await client.post("/api/users/invite", json={
        "email": invite_email,
        "password": "newuserpassword123",
        "name": "Invited User",
        "role": "editor",
    }, headers={
        "Authorization": f"Bearer {admin_token}",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == invite_email
    assert data["name"] == "Invited User"
    assert data["role"] == "editor"
    assert data["is_active"] is True


async def test_invite_user_duplicate_email(client, db_session):
    admin_token, _ = await _get_admin_token(client, db_session, "invitedupadmin")
    dup_email = _unique_email("invitedup")

    # First invite
    resp1 = await client.post("/api/users/invite", json={
        "email": dup_email,
        "password": "password123",
        "name": "First",
    }, headers={
        "Authorization": f"Bearer {admin_token}",
    })
    assert resp1.status_code == 201

    # Second invite with the same email
    resp2 = await client.post("/api/users/invite", json={
        "email": dup_email,
        "password": "password456",
        "name": "Second",
    }, headers={
        "Authorization": f"Bearer {admin_token}",
    })
    assert resp2.status_code == 409


async def test_invite_user_as_editor(client):
    _, editor_token, _ = await _register_user(client, "inviteeditor")

    response = await client.post("/api/users/invite", json={
        "email": _unique_email("shouldfail"),
        "password": "password123",
        "name": "Should Fail",
    }, headers={
        "Authorization": f"Bearer {editor_token}",
    })
    assert response.status_code == 403


# --- Change Role ---


async def test_change_role_as_admin(client, db_session):
    admin_token, _ = await _get_admin_token(client, db_session, "roleadmin")
    _, _, target_user_id = await _register_user(client, "roletarget")

    response = await client.patch(f"/api/users/{target_user_id}/role", json={
        "role": "admin",
    }, headers={
        "Authorization": f"Bearer {admin_token}",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "admin"
    assert data["id"] == target_user_id


async def test_change_role_user_not_found(client, db_session):
    admin_token, _ = await _get_admin_token(client, db_session, "role404admin")
    fake_id = str(uuid.uuid4())

    response = await client.patch(f"/api/users/{fake_id}/role", json={
        "role": "admin",
    }, headers={
        "Authorization": f"Bearer {admin_token}",
    })
    assert response.status_code == 404


async def test_change_role_as_editor(client):
    _, editor_token, editor_id = await _register_user(client, "roleeditor")

    response = await client.patch(f"/api/users/{editor_id}/role", json={
        "role": "admin",
    }, headers={
        "Authorization": f"Bearer {editor_token}",
    })
    assert response.status_code == 403


# --- Change Active ---


async def test_change_active_as_admin(client, db_session):
    admin_token, _ = await _get_admin_token(client, db_session, "activeadmin")
    _, _, target_user_id = await _register_user(client, "activetarget")

    # Deactivate
    response = await client.patch(f"/api/users/{target_user_id}/active", json={
        "is_active": False,
    }, headers={
        "Authorization": f"Bearer {admin_token}",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["is_active"] is False
    assert data["id"] == target_user_id

    # Re-activate
    response = await client.patch(f"/api/users/{target_user_id}/active", json={
        "is_active": True,
    }, headers={
        "Authorization": f"Bearer {admin_token}",
    })
    assert response.status_code == 200
    assert response.json()["is_active"] is True


async def test_change_active_user_not_found(client, db_session):
    admin_token, _ = await _get_admin_token(client, db_session, "active404admin")
    fake_id = str(uuid.uuid4())

    response = await client.patch(f"/api/users/{fake_id}/active", json={
        "is_active": False,
    }, headers={
        "Authorization": f"Bearer {admin_token}",
    })
    assert response.status_code == 404


async def test_change_active_as_editor(client):
    _, editor_token, editor_id = await _register_user(client, "activeeditor")

    response = await client.patch(f"/api/users/{editor_id}/active", json={
        "is_active": False,
    }, headers={
        "Authorization": f"Bearer {editor_token}",
    })
    assert response.status_code == 403
