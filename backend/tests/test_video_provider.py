"""Tests for video provider abstraction and factory."""

import inspect

import pytest

from app.services.video_provider import (
    AssetStatus,
    MuxProvider,
    ProviderAsset,
    UploadDetails,
    VideoProvider,
    get_video_provider,
)


def test_provider_interface_contract():
    """VideoProvider ABC defines required abstract methods."""
    abstract_methods = {
        name
        for name, method in inspect.getmembers(VideoProvider)
        if getattr(method, "__isabstractmethod__", False)
    }
    assert abstract_methods == {
        "create_upload", "get_upload_details", "get_status", "delete", "get_playback_url",
    }


def test_mux_provider_implements_interface():
    """MuxProvider implements all VideoProvider methods."""
    assert issubclass(MuxProvider, VideoProvider)
    # Should be instantiable (not abstract)
    provider = MuxProvider()
    assert hasattr(provider, "create_upload")
    assert hasattr(provider, "get_upload_details")
    assert hasattr(provider, "get_status")
    assert hasattr(provider, "delete")
    assert hasattr(provider, "get_playback_url")


def test_provider_factory_returns_mux():
    """Provider factory returns MuxProvider for 'mux'."""
    provider = get_video_provider("mux")
    assert isinstance(provider, MuxProvider)


def test_provider_factory_unknown_raises():
    """Provider factory raises ValueError for unknown provider."""
    with pytest.raises(ValueError, match="Unknown video provider"):
        get_video_provider("unknown_provider")


def test_provider_asset_dataclass():
    """ProviderAsset stores asset info correctly."""
    asset = ProviderAsset(asset_id="abc123", playback_id="play456", upload_url="https://upload.url")
    assert asset.asset_id == "abc123"
    assert asset.playback_id == "play456"
    assert asset.upload_url == "https://upload.url"


def test_provider_asset_defaults():
    """ProviderAsset has optional fields."""
    asset = ProviderAsset(asset_id="abc123")
    assert asset.playback_id is None
    assert asset.upload_url is None
    assert asset.upload_id is None


def test_upload_details_dataclass():
    """UploadDetails stores upload check results."""
    details = UploadDetails(asset_id="a1", playback_id="p1", status=AssetStatus.ready)
    assert details.asset_id == "a1"
    assert details.playback_id == "p1"
    assert details.status == AssetStatus.ready


def test_upload_details_defaults():
    """UploadDetails has sensible defaults."""
    details = UploadDetails(asset_id="")
    assert details.playback_id is None
    assert details.status == AssetStatus.waiting


def test_asset_status_values():
    """AssetStatus enum has expected values."""
    assert AssetStatus.waiting == "waiting"
    assert AssetStatus.processing == "processing"
    assert AssetStatus.ready == "ready"
    assert AssetStatus.errored == "errored"


@pytest.mark.asyncio
async def test_mux_playback_url():
    """MuxProvider returns correct playback URL format."""
    provider = MuxProvider()
    url = await provider.get_playback_url("test-playback-id")
    assert url == "https://stream.mux.com/test-playback-id.m3u8"
