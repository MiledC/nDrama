import secrets

from redis.asyncio import Redis

from app.config import settings

SESSION_PREFIX = "session:"
RATE_PREFIX = "rate:"
SESSION_TTL = settings.session_ttl_days * 24 * 60 * 60  # 90 days in seconds

redis: Redis | None = None


async def get_redis() -> Redis:
    global redis
    if redis is None:
        redis = Redis.from_url(settings.redis_url, decode_responses=True)
    return redis


async def close_redis() -> None:
    global redis
    if redis is not None:
        await redis.close()
        redis = None


async def create_session(subscriber_id: str) -> str:
    """Create a new session token for a subscriber."""
    r = await get_redis()
    token = f"ndrama_sess_{secrets.token_hex(32)}"
    await r.setex(f"{SESSION_PREFIX}{token}", SESSION_TTL, subscriber_id)
    return token


async def get_session(token: str) -> str | None:
    """Look up session token, refresh TTL on hit."""
    r = await get_redis()
    key = f"{SESSION_PREFIX}{token}"
    subscriber_id = await r.get(key)
    if subscriber_id:
        await r.expire(key, SESSION_TTL)
    return subscriber_id


async def delete_session(token: str) -> None:
    """Delete a single session token."""
    r = await get_redis()
    await r.delete(f"{SESSION_PREFIX}{token}")


async def delete_all_sessions(subscriber_id: str) -> None:
    """Delete all sessions for a subscriber (for ban/suspend/delete)."""
    r = await get_redis()
    cursor = "0"
    while cursor:
        cursor, keys = await r.scan(
            cursor=cursor, match=f"{SESSION_PREFIX}*", count=100
        )
        for key in keys:
            stored_id = await r.get(key)
            if stored_id == subscriber_id:
                await r.delete(key)
        if cursor == 0:
            break
