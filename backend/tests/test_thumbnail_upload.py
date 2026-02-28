import io
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestThumbnailUpload:
    async def test_upload_valid_image(self, admin_client: AsyncClient):
        # Create a minimal PNG (1x1 pixel)
        png_bytes = (
            b"\x89PNG\r\n\x1a\n"
            b"\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
            b"\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx"
            b"\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00"
            b"\x00\x00\x00IEND\xaeB`\x82"
        )

        with patch("app.routers.upload.storage") as mock_storage:
            mock_storage.upload = AsyncMock(
                return_value="http://localhost:9000/ndrama/thumbnails/test.png"
            )
            resp = await admin_client.post(
                "/api/upload/thumbnail",
                files={"file": ("test.png", io.BytesIO(png_bytes), "image/png")},
            )

        assert resp.status_code == 200
        data = resp.json()
        assert "url" in data
        assert data["url"].endswith(".png")

    async def test_upload_invalid_file_type(self, admin_client: AsyncClient):
        resp = await admin_client.post(
            "/api/upload/thumbnail",
            files={"file": ("test.txt", io.BytesIO(b"hello"), "text/plain")},
        )
        assert resp.status_code == 422

    async def test_upload_unauthenticated(self, client: AsyncClient):
        resp = await client.post(
            "/api/upload/thumbnail",
            files={"file": ("test.png", io.BytesIO(b"fake"), "image/png")},
        )
        assert resp.status_code in (401, 403)

    async def test_upload_oversized_file(self, admin_client: AsyncClient):
        # 6MB file (exceeds 5MB limit)
        large_data = b"\x00" * (6 * 1024 * 1024)
        with patch("app.routers.upload.storage") as mock_storage:
            mock_storage.upload = AsyncMock(
                return_value="http://localhost:9000/ndrama/thumbnails/big.png"
            )
            resp = await admin_client.post(
                "/api/upload/thumbnail",
                files={"file": ("big.png", io.BytesIO(large_data), "image/png")},
            )
        assert resp.status_code == 422
