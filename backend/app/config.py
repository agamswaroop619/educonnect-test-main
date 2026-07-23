from decimal import Decimal
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Required — no defaults; missing values raise ValidationError at import time
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_REFRESH_SECRET: str

    # Optional with defaults
    CORS_ORIGINS: List[str] = ["http://localhost:5173"]
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    S3_BUCKET: str = "scholarly-uploads"
    S3_ENDPOINT_URL: str = ""
    APP_VERSION: str = "0.1.0"
    DAILY_LIBRARY_FINE_RATE: Decimal = Decimal("2.00")
    AI_PROVIDER_API_KEY: str = ""
    AI_PROVIDER_BASE_URL: str = "https://api.openai.com/v1"
    AI_MODEL: str = "gpt-4o-mini"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: object) -> List[str]:
        """Accept a comma-separated string or a list; always return list[str]."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v  # already a list (e.g. when constructed directly in tests)


# Singleton — raises ValidationError immediately if required vars are absent
settings = Settings()
