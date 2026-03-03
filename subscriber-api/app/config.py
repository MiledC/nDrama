from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    app_name: str = "nDrama Subscriber API"
    debug: bool = False

    # Database (shared with admin backend)
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ndrama"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Session
    session_ttl_days: int = 90

    # Rate limiting
    rate_limit_per_minute: int = 60

    # MinIO / S3
    s3_endpoint: str = "http://localhost:9000"
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = "minioadmin"
    s3_bucket: str = "ndrama"


settings = Settings()
