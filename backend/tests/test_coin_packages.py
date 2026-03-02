"""Tests for coin package CRUD endpoints."""

import uuid

import httpx
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from tests.factories import make_coin_package


@pytest.mark.asyncio
async def test_list_packages(
    admin_client: httpx.AsyncClient, admin_user: User, db_session: AsyncSession
):
    """Test listing all coin packages."""
    pkg1 = make_coin_package(admin_user.id, name="Starter", coin_amount=50, sort_order=0)
    pkg2 = make_coin_package(admin_user.id, name="Premium", coin_amount=500, sort_order=1)
    db_session.add_all([pkg1, pkg2])
    await db_session.commit()

    response = await admin_client.get("/api/coin-packages")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2
    # Ordered by sort_order
    assert data["items"][0]["name"] == "Starter"
    assert data["items"][1]["name"] == "Premium"


@pytest.mark.asyncio
async def test_list_packages_as_editor(
    editor_client: httpx.AsyncClient, admin_user: User, db_session: AsyncSession
):
    """Editors can view packages."""
    pkg = make_coin_package(admin_user.id)
    db_session.add(pkg)
    await db_session.commit()

    response = await editor_client.get("/api/coin-packages")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_list_packages_no_auth(client: httpx.AsyncClient):
    """Unauthenticated requests are rejected."""
    response = await client.get("/api/coin-packages")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_create_package(admin_client: httpx.AsyncClient):
    """Admin can create a coin package."""
    response = await admin_client.post(
        "/api/coin-packages",
        json={
            "name": "Gold Pack",
            "description": "500 coins for a great price",
            "coin_amount": 500,
            "price_sar": "19.99",
            "sort_order": 1,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Gold Pack"
    assert data["coin_amount"] == 500
    assert data["price_sar"] == "19.99"
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_create_package_editor_rejected(editor_client: httpx.AsyncClient):
    """Editors cannot create packages."""
    response = await editor_client.post(
        "/api/coin-packages",
        json={
            "name": "Attempt",
            "coin_amount": 100,
            "price_sar": "9.99",
        },
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_package_validation(admin_client: httpx.AsyncClient):
    """Validation rejects invalid values."""
    response = await admin_client.post(
        "/api/coin-packages",
        json={
            "name": "",
            "coin_amount": -1,
            "price_sar": "0",
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_update_package(
    admin_client: httpx.AsyncClient, admin_user: User, db_session: AsyncSession
):
    """Admin can update a coin package."""
    pkg = make_coin_package(admin_user.id, name="Old Name")
    db_session.add(pkg)
    await db_session.commit()

    response = await admin_client.patch(
        f"/api/coin-packages/{pkg.id}",
        json={"name": "New Name", "coin_amount": 200},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New Name"
    assert data["coin_amount"] == 200


@pytest.mark.asyncio
async def test_update_package_editor_rejected(
    editor_client: httpx.AsyncClient, admin_user: User, db_session: AsyncSession
):
    """Editors cannot update packages."""
    pkg = make_coin_package(admin_user.id)
    db_session.add(pkg)
    await db_session.commit()

    response = await editor_client.patch(
        f"/api/coin-packages/{pkg.id}",
        json={"name": "Hack"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_package_not_found(admin_client: httpx.AsyncClient):
    """Test 404 on non-existent package."""
    response = await admin_client.patch(
        f"/api/coin-packages/{uuid.uuid4()}",
        json={"name": "Ghost"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_package(
    admin_client: httpx.AsyncClient, admin_user: User, db_session: AsyncSession
):
    """Admin can soft-delete a coin package."""
    pkg = make_coin_package(admin_user.id)
    db_session.add(pkg)
    await db_session.commit()

    response = await admin_client.delete(f"/api/coin-packages/{pkg.id}")
    assert response.status_code == 204

    # Verify soft-deleted (still in list but inactive)
    response = await admin_client.get("/api/coin-packages")
    data = response.json()
    found = [p for p in data["items"] if p["id"] == str(pkg.id)]
    assert len(found) == 1
    assert found[0]["is_active"] is False


@pytest.mark.asyncio
async def test_delete_package_editor_rejected(
    editor_client: httpx.AsyncClient, admin_user: User, db_session: AsyncSession
):
    """Editors cannot delete packages."""
    pkg = make_coin_package(admin_user.id)
    db_session.add(pkg)
    await db_session.commit()

    response = await editor_client.delete(f"/api/coin-packages/{pkg.id}")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_package_not_found(admin_client: httpx.AsyncClient):
    """Test 404 on non-existent package."""
    response = await admin_client.delete(f"/api/coin-packages/{uuid.uuid4()}")
    assert response.status_code == 404
