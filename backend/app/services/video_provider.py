import enum
from abc import ABC, abstractmethod
from dataclasses import dataclass

import httpx

from app.config import settings


class AssetStatus(enum.StrEnum):
    waiting = "waiting"
    processing = "processing"
    ready = "ready"
    errored = "errored"


@dataclass
class ProviderAsset:
    asset_id: str
    playback_id: str | None = None
    upload_url: str | None = None


class VideoProvider(ABC):
    @abstractmethod
    async def create_upload(self, filename: str) -> ProviderAsset:
        """Create a direct upload URL. Returns asset info with upload URL."""
        ...

    @abstractmethod
    async def get_status(self, asset_id: str) -> AssetStatus:
        """Get the processing status of an asset."""
        ...

    @abstractmethod
    async def delete(self, asset_id: str) -> None:
        """Delete an asset from the provider."""
        ...

    @abstractmethod
    async def get_playback_url(self, playback_id: str) -> str:
        """Get a playback URL for the given playback ID."""
        ...


class MuxProvider(VideoProvider):
    BASE_URL = "https://api.mux.com"

    def __init__(self):
        self.auth = (settings.mux_token_id, settings.mux_token_secret)

    async def create_upload(self, filename: str) -> ProviderAsset:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.BASE_URL}/video/v1/uploads",
                json={
                    "new_asset_settings": {
                        "playback_policy": ["public"],
                    },
                    "cors_origin": settings.frontend_url,
                },
                auth=self.auth,
            )
            resp.raise_for_status()
            data = resp.json()["data"]
            asset_id = data.get("asset_id", "")
            return ProviderAsset(
                asset_id=asset_id,
                upload_url=data["url"],
            )

    async def get_status(self, asset_id: str) -> AssetStatus:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.BASE_URL}/video/v1/assets/{asset_id}",
                auth=self.auth,
            )
            resp.raise_for_status()
            data = resp.json()["data"]
            mux_status = data["status"]
            status_map = {
                "preparing": AssetStatus.processing,
                "ready": AssetStatus.ready,
                "errored": AssetStatus.errored,
            }
            return status_map.get(mux_status, AssetStatus.waiting)

    async def delete(self, asset_id: str) -> None:
        async with httpx.AsyncClient() as client:
            resp = await client.delete(
                f"{self.BASE_URL}/video/v1/assets/{asset_id}",
                auth=self.auth,
            )
            resp.raise_for_status()

    async def get_playback_url(self, playback_id: str) -> str:
        return f"https://stream.mux.com/{playback_id}.m3u8"


_providers: dict[str, type[VideoProvider]] = {
    "mux": MuxProvider,
}


def get_video_provider(provider_name: str | None = None) -> VideoProvider:
    """Factory: return a VideoProvider instance based on config or override."""
    name = provider_name or settings.video_provider
    cls = _providers.get(name)
    if cls is None:
        raise ValueError(f"Unknown video provider: {name}")
    return cls()
