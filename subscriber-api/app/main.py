from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.middleware.rate_limit import RateLimitMiddleware
from app.redis import close_redis
from app.routers.auth import router as auth_router
from app.routers.categories import router as categories_router
from app.routers.coins import router as coins_router
from app.routers.episodes import router as episodes_router
from app.routers.favorites import router as favorites_router
from app.routers.history import router as history_router
from app.routers.home import router as home_router
from app.routers.profile import router as profile_router
from app.routers.series import router as series_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_redis()


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    lifespan=lifespan,
)

app.add_middleware(RateLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(series_router)
app.include_router(episodes_router)
app.include_router(categories_router)
app.include_router(coins_router)
app.include_router(favorites_router)
app.include_router(history_router)
app.include_router(home_router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
