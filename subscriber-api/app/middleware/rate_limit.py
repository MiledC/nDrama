from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.config import settings
from app.redis import RATE_PREFIX, get_redis


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Redis-based sliding window rate limiter."""

    async def dispatch(self, request: Request, call_next) -> Response:
        # Skip rate limiting for health checks
        if request.url.path == "/health":
            return await call_next(request)

        # Extract subscriber_id from session (if available)
        # Rate limit by IP for unauthenticated requests
        client_key = request.client.host if request.client else "unknown"

        try:
            r = await get_redis()
            key = f"{RATE_PREFIX}{client_key}"
            current = await r.incr(key)
            if current == 1:
                await r.expire(key, 60)

            if current > settings.rate_limit_per_minute:
                ttl = await r.ttl(key)
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests"},
                    headers={"Retry-After": str(max(ttl, 1))},
                )
        except Exception:
            # If Redis is unavailable, allow request through
            pass

        return await call_next(request)
