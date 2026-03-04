from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.config import settings
from app.routers.audio_tracks import router as audio_tracks_router
from app.routers.auth import router as auth_router
from app.routers.categories import router as categories_router
from app.routers.coin_packages import router as coin_packages_router
from app.routers.dashboard import router as dashboard_router
from app.routers.episodes import router as episodes_router
from app.routers.search import router as search_router
from app.routers.series import router as series_router
from app.routers.subscribers import router as subscribers_router
from app.routers.subtitles import router as subtitles_router
from app.routers.tags import router as tags_router
from app.routers.upload import router as upload_router
from app.routers.users import router as users_router

app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.frontend_url.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SessionMiddleware, secret_key=settings.jwt_secret_key)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(tags_router)
app.include_router(categories_router)
app.include_router(series_router)
app.include_router(episodes_router)
app.include_router(audio_tracks_router)
app.include_router(subtitles_router)
app.include_router(upload_router)
app.include_router(subscribers_router)
app.include_router(coin_packages_router)
app.include_router(dashboard_router)
app.include_router(search_router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
